import { supabase } from '@/lib/supabaseClient';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return new Response('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const id = formData.get('id');

    if (!id) {
        return new Response('Missing ID', { status: 400 });
    }

    const { error } = await supabase
        .from('job_listings')
        .update({ is_actioned: true })
        .eq('id', id);

    if (error) {
        console.error('Error updating job:', error);
        return new Response('Error', { status: 500 });
    }

    // Redirect back to dashboard to refresh
    return redirect('/dashboard');
}
