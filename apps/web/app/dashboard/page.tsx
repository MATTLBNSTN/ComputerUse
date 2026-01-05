import { supabase } from '@/lib/supabaseClient';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ControlPanel } from '@/components/ControlPanel';
import Link from 'next/link';
import { FileText, Folder, CheckCircle, ExternalLink } from 'lucide-react';

// Force dynamic rendering because we are fetching data
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const { userId, getToken } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    // AUTHENTICATE SUPABASE
    const token = await getToken({ template: 'supabase' });
    console.log(`[Dashboard] User: ${userId}`);
    console.log(`[Dashboard] Has Token: ${!!token}`);

    if (!token) {
        console.error("[Dashboard] No Token from Clerk! Check JWT Template 'supabase'.");
    }

    // Note: We use the existing URL/Key but override the header
    const { data: jobs, error } = await supabase
        .from('job_listings')
        .select('*')
        .order('created_at', { ascending: false })
        .setHeader('Authorization', `Bearer ${token}`);

    if (error) {
        console.error("Supabase Error Full:", JSON.stringify(error, null, 2));
        return <div className="p-8">Error loading jobs</div>;
    }

    const unactionedJobs = jobs?.filter(j => !j.is_actioned) || [];
    const actionedJobs = jobs?.filter(j => j.is_actioned) || [];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <nav className="border-b bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <h1 className="text-xl font-bold tracking-tight">Apply-on-Autopilot</h1>
                <div className="flex gap-4 text-sm">
                    <span className="text-slate-500">Logged in as {userId}</span>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6 cursor-default">
                <header className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-800">Your Opportunities</h2>
                    <p className="text-slate-500">Review generated assets and apply.</p>
                </header>

                <ControlPanel />

                <section className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Ready for Review ({unactionedJobs.length})
                    </h3>

                    <div className="grid gap-4">
                        {unactionedJobs.length === 0 ? (
                            <p className="text-slate-400 italic">No new jobs found. Waiting for the agent...</p>
                        ) : (
                            unactionedJobs.map(job => (
                                <JobCard key={job.id} job={job} />
                            ))
                        )}
                    </div>
                </section>

                <section className="mt-12 space-y-6 opacity-80">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-600">
                        <CheckCircle className="w-4 h-4" />
                        Actioned ({actionedJobs.length})
                    </h3>
                    <div className="grid gap-4">
                        {actionedJobs.map(job => (
                            <JobCard key={job.id} job={job} isActioned />
                        ))}
                    </div>
                </section>

            </main >
        </div >
    );
}

function JobCard({ job, isActioned = false }: { job: any, isActioned?: boolean }) {
    return (
        <div className={`group relative bg-white border border-slate-200 rounded-lg p-5 shadow-sm transition-all hover:shadow-md ${isActioned ? 'bg-slate-50' : ''}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        <a href={job.job_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                            {job.role_title} <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                    </h4>
                    <p className="text-slate-500 font-medium">{job.company_name}</p>
                    <div className="text-xs text-slate-400 mt-1">Found: {new Date(job.created_at).toLocaleString()}</div>
                </div>

                <div className="flex items-center gap-3">
                    {job.resume_url ? (
                        <a href={job.resume_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 border border-slate-200">
                            <FileText className="w-4 h-4 text-blue-500" />
                            Resume
                        </a>
                    ) : (
                        <span className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 bg-slate-50 rounded-md border border-dashed border-slate-200">
                            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                            Generating...
                        </span>
                    )}

                    {job.cover_letter_url && (
                        <a href={job.cover_letter_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 border border-slate-200">
                            <FileText className="w-4 h-4 text-green-500" />
                            Cover Letter
                        </a>
                    )}

                    {!isActioned && (
                        <form action={`/api/action`} method="POST">
                            <input type="hidden" name="id" value={job.id} />
                            <button type="submit"
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm shadow-blue-200">
                                Apply / Action
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
