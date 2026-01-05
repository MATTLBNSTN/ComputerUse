import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const KEY = process.env.GOOGLE_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${KEY}`;

async function check() {
    console.log("Hitting API directly...");
    try {
        const res = await fetch(URL);
        const data = await res.json();
        console.log("Status:", res.status);
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => console.log(` - ${m.name} (${m.supportedGenerationMethods})`));
        } else {
            console.log("Response:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

check();
