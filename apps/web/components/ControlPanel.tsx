'use client';

import { useState, useEffect } from 'react';
import { Play, FileText, Loader2, AlertCircle, Terminal } from 'lucide-react';

interface StatusState {
    status: 'IDLE' | 'RUNNING' | 'COMPLETE' | 'ERROR';
    logs: string[];
}

export function ControlPanel() {
    const [source, setSource] = useState('linkedin');
    const [ingestStatus, setIngestStatus] = useState<StatusState>({ status: 'IDLE', logs: [] });
    const [generateStatus, setGenerateStatus] = useState<StatusState>({ status: 'IDLE', logs: [] });
    const [polling, setPolling] = useState(false);

    // Poll status every 2 seconds
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (polling) {
            interval = setInterval(async () => {
                try {
                    // Note: In real prod, use Next.js API route as proxy to avoid mixed content/cors
                    // For local MVP, direct call to worker port 3001 is fine if CORS allows
                    const res = await fetch('http://localhost:3001/api/status');
                    const data = await res.json();
                    setIngestStatus(data.ingest);
                    setGenerateStatus(data.generate);
                } catch (e) {
                    console.error("Failed to poll worker", e);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [polling]);

    // Start polling on mount
    useEffect(() => {
        setPolling(true);
    }, []);

    const handleStartIngest = async () => {
        try {
            await fetch('http://localhost:3001/api/start-ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source })
            });
        } catch (e) {
            alert('Failed to start ingest. Is worker running?');
        }
    };

    const handleStartGenerate = async () => {
        try {
            await fetch('http://localhost:3001/api/start-generate', {
                method: 'POST'
            });
        } catch (e) {
            alert('Failed to start generation.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-gray-500" />
                Control Center
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* INGESTION COLUMN */}
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-700">1. Job Collection</h3>

                    <div className="flex gap-2">
                        <select
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            className="border rounded px-3 py-2 text-sm w-full"
                        >
                            <option value="linkedin">LinkedIn (Guest/Native)</option>
                            <option value="xray">Google X-Ray (Stealth)</option>
                            <option value="indeed">Indeed (Experimental)</option>
                        </select>
                        <button
                            onClick={handleStartIngest}
                            disabled={ingestStatus.status === 'RUNNING'}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                        >
                            {ingestStatus.status === 'RUNNING' ? <Loader2 className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4" />}
                            Start Ingest
                        </button>
                    </div>

                    {/* LOGS */}
                    <div className="bg-gray-900 text-green-400 text-xs font-mono p-3 rounded h-32 overflow-y-auto">
                        <div className="mb-2 text-gray-500 border-b border-gray-800 pb-1">STATUS: {ingestStatus.status}</div>
                        {ingestStatus.logs.slice().reverse().map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                        {ingestStatus.logs.length === 0 && <span className="opacity-50">Waiting to start...</span>}
                    </div>
                </div>

                {/* GENERATION COLUMN */}
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-700">2. AI Generation</h3>

                    <button
                        onClick={handleStartGenerate}
                        disabled={generateStatus.status === 'RUNNING'}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {generateStatus.status === 'RUNNING' ? <Loader2 className="animate-spin w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        Generate Docs (Gemini)
                    </button>

                    {/* LOGS */}
                    <div className="bg-gray-900 text-purple-300 text-xs font-mono p-3 rounded h-32 overflow-y-auto">
                        <div className="mb-2 text-gray-500 border-b border-gray-800 pb-1">STATUS: {generateStatus.status}</div>
                        {generateStatus.logs.slice().reverse().map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                        {generateStatus.logs.length === 0 && <span className="opacity-50">Waiting to start...</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
