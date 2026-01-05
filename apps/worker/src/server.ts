import express from 'express';
import cors from 'cors';
import { scrapeJobs } from './ingest';
import { generateAssets } from './generate'; // You need to export this in generate.ts

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Global Status Trackers
let ingestStatus = { status: 'IDLE', logs: [] as string[] };
let generateStatus = { status: 'IDLE', logs: [] as string[] };

// Utility to add log
function logIngest(msg: string) {
    ingestStatus.logs.push(`[${new Date().toISOString()}] ${msg}`);
    // Keep logs manageable
    if (ingestStatus.logs.length > 50) ingestStatus.logs.shift();
}

app.get('/api/status', (req, res) => {
    res.json({
        ingest: ingestStatus,
        generate: generateStatus
    });
});

app.post('/api/start-ingest', async (req, res) => {
    if (ingestStatus.status === 'RUNNING') {
        return res.status(409).json({ message: 'Ingestion already running' });
    }

    const { source, keywords, location } = req.body;

    ingestStatus.status = 'RUNNING';
    ingestStatus.logs = [`Starting ingestion for ${source || 'linkedin'}...`];
    res.json({ message: 'Ingestion started' });

    try {
        // Run asynchronously
        logIngest(`Mode: ${source}`);
        await scrapeJobs({ source, keywords, location });
        ingestStatus.status = 'COMPLETE';
        logIngest('Ingestion completed successfully.');
    } catch (err: any) {
        ingestStatus.status = 'ERROR';
        logIngest(`Error: ${err.message}`);
    }
});

app.post('/api/start-generate', async (req, res) => {
    if (generateStatus.status === 'RUNNING') {
        return res.status(409).json({ message: 'Generation already running' });
    }

    generateStatus.status = 'RUNNING';
    generateStatus.logs = ['Starting generation...'];
    res.json({ message: 'Generation started' });

    try {
        await generateAssets();
        generateStatus.status = 'COMPLETE';
        generateStatus.logs.push('Generation completed.');
    } catch (err: any) {
        generateStatus.status = 'ERROR';
        generateStatus.logs.push(`Error: ${err.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`Worker API running on http://localhost:${PORT}`);
});
