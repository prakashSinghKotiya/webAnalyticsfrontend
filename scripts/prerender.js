import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { PUBLIC_ROUTES, generateSitemapXml, generateRobotsTxt } from '../src/seo/routes.js';

async function prerender() {
  console.log('[prerender] Starting MonitorMyHost static prerendering pipeline...');

  const templatePath = path.resolve('dist/index.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error('dist/index.html not found. Ensure "vite build" runs before prerender.');
  }
  const rawTemplate = fs.readFileSync(templatePath, 'utf-8');

  // Step 1: Compile SSR bundle using Vite
  console.log('[prerender] Compiling SSR bundle with Vite...');
  await build({
    build: {
      ssr: 'src/prerender/entry-server.jsx',
      outDir: 'dist-ssr',
      emptyOutDir: true,
      logLevel: 'warn',
    },
  });

  const ssrEntryPath = path.resolve('dist-ssr/entry-server.js');
  const { render } = await import(`${pathToFileURL(ssrEntryPath).href}?t=${Date.now()}`);

  // Step 2: Prerender each of the canonical public routes
  console.log(`[prerender] Generating ${PUBLIC_ROUTES.length} canonical public pages...`);
  for (const route of PUBLIC_ROUTES) {
    console.log(`[prerender] -> Prerendering ${route.path}...`);
    const appHtml = render(route.path);

    // Build head tags to inject
    const headInjections = [
      `<title>${escapeHtml(route.title)}</title>`,
      `<meta name="description" content="${escapeAttr(route.description)}" />`,
      `<meta name="keywords" content="${escapeAttr(route.keywords)}" />`,
      `<link rel="canonical" href="${route.canonical}" />`,
      `<meta property="og:title" content="${escapeAttr(route.ogTitle || route.title)}" />`,
      `<meta property="og:description" content="${escapeAttr(route.description)}" />`,
      `<meta property="og:url" content="${route.canonical}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="MonitorMyHost" />`,
      `<meta property="og:image" content="https://monitormyhost.com/og-image.png" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeAttr(route.twitterTitle || route.title)}" />`,
      `<meta name="twitter:description" content="${escapeAttr(route.description)}" />`,
      `<meta name="twitter:image" content="https://monitormyhost.com/og-image.png" />`,
      `<script id="json-ld-seo-live" type="application/ld+json">${JSON.stringify(route.structuredData)}</script>`,
    ].join('\n    ');

    // Replace default head elements
    let pageHtml = rawTemplate;

    // Replace title
    if (pageHtml.includes('<title>')) {
      pageHtml = pageHtml.replace(/<title>[\s\S]*?<\/title>/i, '');
    }
    // Replace default description
    pageHtml = pageHtml.replace(/<meta\s+name=["']description["'][\s\S]*?>/i, '');

    // Inject our rich head metadata right after <meta name="viewport" ... /> or before </head>
    pageHtml = pageHtml.replace('</head>', `  ${headInjections}\n  </head>`);

    // Inject prerendered body markup
    pageHtml = pageHtml.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

    // Determine target file location
    let outFilePath;
    if (route.path === '/') {
      outFilePath = path.resolve('dist/index.html');
    } else {
      const outDir = path.resolve(`dist${route.path}`);
      fs.mkdirSync(outDir, { recursive: true });
      outFilePath = path.join(outDir, 'index.html');
    }

    fs.writeFileSync(outFilePath, pageHtml, 'utf-8');
    const sizeKb = (Buffer.byteLength(pageHtml, 'utf-8') / 1024).toFixed(2);
    console.log(`[prerender]    Generated ${path.relative(process.cwd(), outFilePath)} (${sizeKb} kB)`);
  }

  // Step 3: Prerender 404 page for cPanel ErrorDocument 404
  console.log('[prerender] -> Prerendering 404.html...');
  const notFoundHtml = render('/404');
  let notFoundPage = rawTemplate;
  notFoundPage = notFoundPage.replace(/<title>[\s\S]*?<\/title>/i, '');
  notFoundPage = notFoundPage.replace(/<meta\s+name=["']description["'][\s\S]*?>/i, '');
  const notFoundHead = [
    '<title>404 — Page Not Found | MonitorMyHost</title>',
    '<meta name="description" content="The page you requested could not be found." />',
    '<meta name="robots" content="noindex, nofollow" />',
  ].join('\n    ');
  notFoundPage = notFoundPage.replace('</head>', `  ${notFoundHead}\n  </head>`);
  notFoundPage = notFoundPage.replace('<div id="root"></div>', `<div id="root">${notFoundHtml}</div>`);
  fs.writeFileSync(path.resolve('dist/404.html'), notFoundPage, 'utf-8');
  console.log('[prerender]    Generated dist/404.html');

  // Step 4: Generate Sitemap and Robots
  console.log('[prerender] Generating sitemap.xml and robots.txt...');
  fs.writeFileSync(path.resolve('dist/sitemap.xml'), generateSitemapXml(), 'utf-8');
  fs.writeFileSync(path.resolve('dist/robots.txt'), generateRobotsTxt(), 'utf-8');
  console.log('[prerender]    Generated dist/sitemap.xml and dist/robots.txt');

  // Step 5: Clean up temporary SSR bundle
  if (fs.existsSync(path.resolve('dist-ssr'))) {
    fs.rmSync(path.resolve('dist-ssr'), { recursive: true, force: true });
    console.log('[prerender] Cleaned up temporary dist-ssr directory.');
  }

  console.log('[prerender] Static prerendering complete successfully!');
}

function escapeHtml(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str = '') {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

prerender().catch((err) => {
  console.error('[prerender] FAILED:', err);
  process.exit(1);
});
