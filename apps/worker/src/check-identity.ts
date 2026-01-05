import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

async function checkIdentity() {
    console.log("Initializing Google Auth...");

    // Explicitly log what credentials we are using
    const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credsPath) {
        console.log(`Using credentials from: ${credsPath}`);
    } else {
        console.log("Using default credentials (ADC).");
    }

    try {
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const client = await auth.getClient();
        const drive = google.drive({ version: 'v3', auth: client as any });

        console.log("Fetching About info...");
        const res = await drive.about.get({
            fields: 'user, storageQuota'
        });

        const data = res.data as any; // Bypass TS strictness for quick debug
        const user = data.user;
        const quota = data.storageQuota;

        console.log("\n--- Identity ---");
        console.log(`Name: ${user?.displayName}`);
        console.log(`Email: ${user?.emailAddress}`);
        console.log(`Me: ${user?.me}`);

        console.log("\n--- Storage Quota ---");
        if (quota) {
            const usage = parseInt(quota.usage || '0');
            const limit = parseInt(quota.limit || '0');
            const usageGB = (usage / (1024 * 1024 * 1024)).toFixed(2);
            const limitGB = limit > 0 ? (limit / (1024 * 1024 * 1024)).toFixed(2) : 'Unlimited';

            console.log(`Usage: ${usageGB} GB`);
            console.log(`Limit: ${limitGB} GB`);
            console.log(`In Trash: ${quota.usageInDriveTrash}`);
        } else {
            console.log("No quota info available.");
        }

    } catch (err) {
        console.error("Error checking identity:", err);
    }
}

checkIdentity();
