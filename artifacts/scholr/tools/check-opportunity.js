const { chromium } = require('playwright');

async function run(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  const title = await page.title();
  const description = await page.$eval('meta[name="description"]', el => el.content).catch(() => null);
  const canonical = await page.$eval('link[rel="canonical"]', el => el.href).catch(() => null);
  const jsonldTexts = await page.$$eval('script[type="application/ld+json"]', els => els.map(e => e.textContent));
  const parsedJsonLd = jsonldTexts.map((t) => {
    try { return JSON.parse(t || 'null'); } catch { return null; }
  }).filter(Boolean);
  const h1 = await page.$eval('h1', el => el.innerText).catch(() => null);
  const mainHtml = await page.$eval('main', el => el.innerText.slice(0, 2000)).catch(() => null);

  console.log('URL:', url);
  console.log('title:', title);
  console.log('description:', description);
  console.log('canonical:', canonical);
  console.log('jsonLd count:', parsedJsonLd.length);
  parsedJsonLd.slice(0,3).forEach((j, i) => console.log(`jsonLd[${i}].@type:`, j['@type'] || j['type'] || '(no @type)'));
  console.log('h1:', h1);
  console.log('main (truncated):', mainHtml ? mainHtml.replace(/\s+/g,' ').slice(0,800) : null);

  await browser.close();
}

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node tools/check-opportunity.js <slug>');
  process.exit(2);
}
const url = `http://localhost:3000/opportunity/${slug}`;
run(url).catch(err => { console.error(err); process.exit(1); });
