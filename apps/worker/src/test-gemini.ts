import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

async function list() {
    console.log("Fetching available models...");
    try {
        // The SDK doesn't expose listModels directly easily in high level, 
        // but we can try a simple generation on a known model or use the lower level generic request if needed.
        // Actually, checking docs, it is not exposed on GoogleGenerativeAI class directly in Node SDK nicely?
        // Let's try just hitting gemini-1.5-flash which is the current default recommendation.

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash:", result.response.text());
    } catch (e) {
        console.error("Error with gemini-1.5-flash:", e);
    }
}

list();
