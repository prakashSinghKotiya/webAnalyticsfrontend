import fs from 'node:fs';

const pages = [
  'dist/index.html',
  'dist/ttfb-test/index.html',
  'dist/fullsite-report/index.html',
  'dist/dns-checker/index.html',
  'dist/redirection-checker/index.html',
  'dist/whois-lookup/index.html',
  'dist/404.html',
];

console.log('\n=== PRE-RENDERED RAW HTML AUDIT ===\n');

for (const p of pages) {
  const content = fs.readFileSync(p, 'utf-8');
  const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
  const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const ldJsonMatch = content.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  const cleanH1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : 'NONE';
  const hasFaq = content.includes('Frequently Asked Questions');

  console.log(`FILE: ${p}`);
  console.log(`  TITLE:       ${titleMatch ? titleMatch[1] : 'NONE'}`);
  console.log(`  H1:          ${cleanH1}`);
  console.log(`  CANONICAL:   ${canonicalMatch ? canonicalMatch[1] : 'NONE'}`);
  console.log(`  HAS LD+JSON: ${Boolean(ldJsonMatch)}`);
  if (ldJsonMatch) {
    try {
      const json = JSON.parse(ldJsonMatch[1]);
      const types = Array.isArray(json) ? json.map((x) => x['@type']) : [json['@type']];
      console.log(`  SCHEMA TYPE: ${types.join(', ')}`);
    } catch (e) {
      console.log(`  SCHEMA PARSE ERROR: ${e.message}`);
    }
  }
  console.log(`  HAS VISIBLE FAQS: ${hasFaq}`);
  console.log('');
}

