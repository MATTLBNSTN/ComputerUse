import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env.local
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role for backend
const supabase = createClient(supabaseUrl, supabaseKey);

const keywords = process.env.LINKEDIN_KEYWORDS || 'software engineer';
const location = process.env.LINKEDIN_LOCATION || 'United Kingdom';
const workType = process.env.LINKEDIN_WORK_TYPE || '2'; // 2=Remote, 3=Hybrid, 1=On-site
const LINKEDIN_URL = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}&f_WT=${encodeURIComponent(workType)}&origin=JOB_SEARCH_PAGE_JOB_FILTER`;

interface JobListing {
    company_name: string;
    role_title: string;
    job_description: string;
    job_link: string;
    hiring_manager?: string | null;
    user_id: string; // We'll need a default user ID or fetch from config
}

async function scrapeJobs() {
    console.log('Starting ingestion Agent...');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 800 },
        userDataDir: './chrome_data', // Save cookies/session locally
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // STEALTH MODE: Look like a real Windows user
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    await page.setUserAgent(UA);
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
    });

    try {
        console.log(`Navigating to ${LINKEDIN_URL}`);
        await page.goto(LINKEDIN_URL, { waitUntil: 'networkidle2' });

        // TODO: Login logic if needed (LinkedIn often requires auth for detailed views)
        // For now, assuming public view or cookies can be injected.

        // Wait for job cards
        await page.waitForSelector('.jobs-search__results-list');

        // Extract basic info from the list
        // Note: This matches the public guest view. Authenticated view DOM is different.
        const jobs = await page.evaluate(() => {
            const jobCards = document.querySelectorAll('.jobs-search__results-list > li');
            const extracted: any[] = [];

            jobCards.forEach((card) => {
                try {
                    const titleEl = card.querySelector('.base-search-card__title');
                    const companyEl = card.querySelector('.base-search-card__subtitle');
                    const linkEl = card.querySelector('.base-card__full-link');
                    const id = card.getAttribute('data-entity-urn') || '';

                    if (titleEl && companyEl && linkEl) {
                        extracted.push({
                            company_name: companyEl.textContent?.trim(),
                            role_title: titleEl.textContent?.trim(),
                            job_link: (linkEl as HTMLAnchorElement).href,
                            external_id: id
                        });
                    }
                } catch (e) {
                    console.error('Error extracting card', e);
                }
            });
            return extracted;
        });

        console.log(`Found ${jobs.length} jobs.`);

        for (const job of jobs) {
            // Visit each job to get Description
            console.log(`Processing: ${job.role_title} at ${job.company_name}`);
            const jobPage = await browser.newPage();
            await jobPage.goto(job.job_link, { waitUntil: 'domcontentloaded' });

            // Wait for description
            try {
                await jobPage.waitForSelector('.description__text', { timeout: 5000 });
                const description = await jobPage.evaluate(() => {
                    return document.querySelector('.description__text')?.textContent?.trim() || '';
                });

                // Insert into Supabase
                const { error } = await supabase.from('job_listings').upsert({
                    company_name: job.company_name,
                    role_title: job.role_title,
                    job_description: description,
                    job_link: job.job_link,
                    user_id: process.env.DEFAULT_USER_ID || 'user_2r...', // Needs to be set
                    is_actioned: false
                }, { onConflict: 'job_link', ignoreDuplicates: true }); // Using job_link as unique key if schema allows, or handle dups manually

                if (error) console.error('Supabase error:', error);
                else console.log('Saved to DB.');

            } catch (e) {
                console.warn('Failed to get description or write to DB', e);
            } finally {
                await jobPage.close();
            }

            // Sleep random to avoid rate limits
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
        }

    } catch (err) {
        console.error('Scraping failed:', err);
    } finally {
        await browser.close();
    }
}

scrapeJobs();
