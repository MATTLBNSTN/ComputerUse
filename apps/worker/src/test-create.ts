import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

async function testCreate() {
    console.log("Initializing Auth...");
    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const client = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: client as any }); // Cast to any

    try {
        console.log("Attempt 1: Creating in ROOT (Service Account's own drive)...");
        const res1 = await drive.files.create({
            requestBody: {
                name: 'Test_Root_File.txt',
                mimeType: 'text/plain'
            },
            media: {
                mimeType: 'text/plain',
                body: 'Hello World'
            }
        });
        console.log(`✅ Success Root! File ID: ${res1.data.id}`);
    } catch (e: any) {
        console.error(`❌ Failed Root: ${e.message}`);
    }

    // Try finding the folder again to get ID
    let folderId = '';
    try {
        const folderRes = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and name='Review_Docs' and trashed=false",
            fields: 'files(id, name)',
        });
        if (folderRes.data.files && folderRes.data.files.length > 0) {
            folderId = folderRes.data.files[0].id!;
            console.log(`\nFound Shared Folder ID: ${folderId}`);

            console.log("Attempt 2: Creating in SHARED FOLDER...");
            const res2 = await drive.files.create({
                requestBody: {
                    name: 'Test_Shared_File.txt',
                    mimeType: 'text/plain',
                    parents: [folderId]
                },
                media: {
                    mimeType: 'text/plain',
                    body: 'Hello World'
                }
            });
            console.log(`✅ Success Shared! File ID: ${res2.data.id}`);

        } else {
            console.log("\n⚠️ Review_Docs folder not found, skipping shared test.");
        }
    } catch (e: any) {
        console.error(`❌ Failed Shared: ${e.message}`);
    }
}

testCreate();
