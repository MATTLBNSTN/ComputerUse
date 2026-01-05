import puppeteer from 'puppeteer';

export async function scrapeIndeed(keywords: string, location: string) {
    console.log(`[Indeed] Searching for: ${keywords} in ${location}`);

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 800 },
        userDataDir: './chrome_data',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    // STEALTH
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    await page.setUserAgent(UA);
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    const URL = `https://www.indeed.com/jobs?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}`;

    try {
        await page.goto(URL, { waitUntil: 'networkidle2' });

        // Wait for results
        // Indeed selector often contains 'job_seen_beacon' or 'resultContent'
        try {
            await page.waitForSelector('.job_seen_beacon', { timeout: 10000 });
        } catch {
            console.log("Indeed: No jobs found or selector changed.");
            return [];
        }

        const jobs = await page.evaluate(() => {
            const cards = document.querySelectorAll('.job_seen_beacon');
            const data: any[] = [];

            cards.forEach(card => {
                const titleEl = card.querySelector('h2.jobTitle span');
                const companyEl = card.querySelector('[data-testid="company-name"]');
                const linkEl = card.querySelector('a.jcs-JobTitle');

                if (titleEl && linkEl) {
                    const href = (linkEl as HTMLAnchorElement).href;
                    data.push({
                        title: titleEl.textContent?.trim(),
                        company: companyEl?.textContent?.trim() || 'Confidential',
                        link: href
                    });
                }
            });
            return data;
        });

        console.log(`[Indeed] Found ${jobs.length} jobs.`);
        return jobs;

    } catch (e) {
        console.error('[Indeed] Error:', e);
        return [];
    } finally {
        await browser.close();
    }
}
