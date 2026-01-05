import puppeteer from 'puppeteer';

export async function scrapeXray(keywords: string, location: string) {
    console.log(`[X-Ray] Searching Google for: ${keywords} in ${location}`);

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 800 },
        userDataDir: './chrome_data',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const query = `site:linkedin.com/jobs "${keywords}" "${location}"`;

    try {
        // STEALTH
        const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        await page.setUserAgent(UA);

        await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });

        // Type query
        await page.type('textarea[name="q"]', query); // Google's search box often uses textarea now, or input[name="q"]
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        // Extract Results
        const links = await page.evaluate(() => {
            const results = document.querySelectorAll('.g'); // Standard Google result class
            const data: any[] = [];

            results.forEach((res) => {
                const anchor = res.querySelector('a');
                const titleEl = res.querySelector('h3');

                if (anchor && titleEl) {
                    const href = anchor.href;
                    // Only keep actual LinkedIn job links
                    if (href.includes('linkedin.com/jobs/view') || href.includes('linkedin.com/jobs')) {
                        data.push({
                            title: titleEl.innerText,
                            link: href
                        });
                    }
                }
            });
            return data;
        });

        console.log(`[X-Ray] Found ${links.length} potential jobs.`);
        return links; // Returns { title, link }

    } catch (e) {
        console.error('[X-Ray] Error:', e);
        return [];
    } finally {
        await browser.close();
    }
}
