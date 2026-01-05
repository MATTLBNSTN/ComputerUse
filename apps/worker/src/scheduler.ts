import { exec } from 'child_process';
import * as util from 'util';

const execAsync = util.promisify(exec);

async function runTask(taskName: string, command: string) {
    console.log(`[${new Date().toISOString()}] Starting ${taskName}...`);
    try {
        const { stdout, stderr } = await execAsync(command);
        console.log(`[${taskName}] Output:\n`, stdout);
        if (stderr) console.error(`[${taskName}] Errors:\n`, stderr);
    } catch (error) {
        console.error(`[${taskName}] Failed:`, error);
    }
    console.log(`[${new Date().toISOString()}] Finished ${taskName}.`);
}

async function startScheduler() {
    console.log('Scheduler started. Running immediately then every 12 hours.');

    const runPipeline = async () => {
        // Run sequentially
        await runTask('Ingestion', 'npm run ingest');
        await runTask('Generation', 'npm run generate');
    };

    // Run on start
    await runPipeline();

    // Schedule every 12 hours (43200000 ms)
    setInterval(runPipeline, 12 * 60 * 60 * 1000);
}

startScheduler();
