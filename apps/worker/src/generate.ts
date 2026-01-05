import { createClient } from '@supabase/supabase-js';
import { VertexAI } from '@google-cloud/vertexai';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

// Setup Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

import { GoogleGenerativeAI } from '@google/generative-ai';
// import { VertexAI } from '@google-cloud/vertexai'; // Removed

// ... imports remain ...

// Setup Gemini (AI Studio)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

// Setup Google Drive/Docs
const auth = new google.auth.GoogleAuth({
    scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents'
    ]
});
const drive = google.drive({ version: 'v3', auth });
const docs = google.docs({ version: 'v1', auth });

export async function generateAssets() {
    console.log('Starting Generator Agent...');

    const { data: jobs, error } = await supabase
        .from('job_listings')
        .select('*')
        .eq('is_actioned', false)
        .is('resume_url', null);

    if (error) {
        console.error('Error fetching jobs:', error);
        return;
    }

    if (!jobs || jobs.length === 0) {
        console.log('No new jobs to process.');
        return;
    }

    console.log(`Found ${jobs.length} jobs.`);

    // Find "Review_Docs" folder
    let folderId = '';
    try {
        const folderRes = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and name='Review_Docs' and trashed=false",
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (folderRes.data.files && folderRes.data.files.length > 0) {
            folderId = folderRes.data.files[0].id!;
            console.log(`Found 'Review_Docs' folder: ${folderId}`);
        } else {
            console.log("'Review_Docs' folder not found. Saving to root.");
        }
    } catch (err) {
        console.error("Error finding folder:", err);
    }

    // Load Assets
    let resumeText = '';
    let guideText = '';
    try {
        resumeText = fs.readFileSync(path.resolve(__dirname, 'assets/Standard_Resume.txt'), 'utf-8');
        guideText = fs.readFileSync(path.resolve(__dirname, 'assets/Writing_Guide.txt'), 'utf-8');
    } catch (e) {
        console.warn("Could not load assets, using defaults.");
    }

    for (const job of jobs) {
        console.log(`Generating content for ${job.role_title} at ${job.company_name}...`);

        try {
            const prompt = `
        You are an expert career coach.
        TASK: Create a tailored resume and cover letter.
        CONTEXT:
        Standard Resume: ${resumeText}
        Writing Guide: ${guideText}
        Job Description: ${job.job_description}
        OUTPUT: JSON with "resume_content" and "cover_letter_content".
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.candidates?.[0].content.parts[0].text;

            let generatedData = { resume_content: "Error", cover_letter_content: "Error" };
            try {
                const jsonMatch = text?.match(/```json\n([\s\S]*?)\n```/) || text?.match(/{[\s\S]*}/);
                if (jsonMatch) {
                    generatedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                }
            } catch (e) {
                console.error("Failed to parse JSON", e);
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filenameBase = `${timestamp}_Title_${job.company_name}`;

            // Create Cover Letter inside Folder using Drive API
            const clFile = await drive.files.create({
                requestBody: {
                    name: `${filenameBase}_CL`,
                    mimeType: 'application/vnd.google-apps.document',
                    parents: folderId ? [folderId] : []
                }
            });
            const clId = clFile.data.id!;

            // Update Content
            await docs.documents.batchUpdate({
                documentId: clId,
                requestBody: { requests: [{ insertText: { text: generatedData.cover_letter_content, location: { index: 1 } } }] }
            });

            // Create Resume inside Folder
            const resFile = await drive.files.create({
                requestBody: {
                    name: `${filenameBase}_Resume`,
                    mimeType: 'application/vnd.google-apps.document',
                    parents: folderId ? [folderId] : []
                }
            });
            const resId = resFile.data.id!;

            await docs.documents.batchUpdate({
                documentId: resId,
                requestBody: { requests: [{ insertText: { text: generatedData.resume_content, location: { index: 1 } } }] }
            });

            const resumeLink = `https://docs.google.com/document/d/${resId}/edit`;
            const clLink = `https://docs.google.com/document/d/${clId}/edit`;

            await supabase.from('job_listings').update({
                resume_url: resumeLink,
                cover_letter_url: clLink,
                drive_folder_url: folderId ? `https://drive.google.com/drive/u/0/folders/${folderId}` : 'https://drive.google.com/drive/u/0/'
            }).eq('id', job.id);

            console.log('Saved.');

        } catch (e) {
            console.error('Error in loop', e);
        }
    }
}



// No auto-execution for API mode
// generateAssets();
