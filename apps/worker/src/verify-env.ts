import * as fs from 'fs';
import * as dotenv from 'dotenv';
import path from 'path';

// emulate the path logic used in ingest.ts and generate.ts
const envPath = path.resolve(__dirname, '../../../.env.local');
console.log(`Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error("Error loading .env.local file:", result.error);
}

const requiredKeys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'GOOGLE_API_KEY', // For Gemini
    'LINKEDIN_KEYWORDS',
    'DEFAULT_USER_ID'
];

console.log('\n--- Environment Variable Check ---');

let allGood = true;

requiredKeys.forEach(key => {
    const value = process.env[key];
    if (!value) {
        console.error(`[MISSING] ${key}`);
        allGood = false;
    } else {
        // Show first 4 chars to verify content without leaking
        const preview = value.length > 4 ? value.substring(0, 4) + '****' : '****';
        console.log(`[OK]      ${key} (${preview})`);
    }
});

// Check Google Credentials specifically
// Usually GOOGLE_APPLICATION_CREDENTIALS points to a file, or keys are in env
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log(`[OK]      GOOGLE_APPLICATION_CREDENTIALS (${process.env.GOOGLE_APPLICATION_CREDENTIALS})`);
    if (fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        console.log(`[OK]      Credentials file exists on disk.`);
    } else {
        console.error(`[ERROR]   Credentials file NOT found at: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
        allGood = false;
    }
} else {
    console.warn(`[WARNING] GOOGLE_APPLICATION_CREDENTIALS is not set. 
    Ensure you have default credentials set up or this var points to your JSON key file.
    If using Vertex AI/Drive locally, this is usually required.`);
}

console.log('\n--- Summary ---');
if (allGood) {
    console.log('✅ Critical variables are present.');
} else {
    console.log('❌ Some variables are missing. Please check .env.local');
}
