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
      `<meta property="og:type" content="${escapeAttr(route.ogType || 'website')}" />`,
      `<meta property="og:site_name" content="MonitorMyHost" />`,
      `<meta property="og:image" content="${escapeAttr(route.ogImage || 'https://monitormyhost.com/og-image.png')}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeAttr(route.twitterTitle || route.title)}" />`,
      `<meta name="twitter:description" content="${escapeAttr(route.description)}" />`,
      `<meta name="twitter:image" content="${escapeAttr(route.ogImage || 'https://monitormyhost.com/og-image.png')}" />`,
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

    // Inject prerendered body markup with path stamp to guide client hydration
    pageHtml = pageHtml.replace(
      '<div id="root"></div>',
      `<div id="root" data-prerendered-path="${route.path}">${appHtml}</div>`,
    );

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
  notFoundPage = notFoundPage.replace(
    '<div id="root"></div>',
    `<div id="root" data-prerendered-path="/404">${notFoundHtml}</div>`,
  );
  fs.writeFileSync(path.resolve('dist/404.html'), notFoundPage, 'utf-8');
  console.log('[prerender]    Generated dist/404.html');

  // Step 3.5: Optionally fetch published reviews from API to prerender dynamic review detail pages
  const dynamicReviewRoutes = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const apiRes = await fetch('http://localhost:5000/review', { signal: controller.signal });
    clearTimeout(timeout);
    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        console.log(`[prerender] Found ${json.data.length} published reviews from API...`);
        for (const rev of json.data) {
          if (!rev.slug) continue;
          const reviewPath = `/hosting-reviews/${rev.slug}`;
          console.log(`[prerender] -> Prerendering dynamic review ${reviewPath}...`);
          const appHtml = render(reviewPath);
          const currentYear = new Date().getFullYear();
          const provider = rev.providerName || 'Hosting';
          const title = `${provider} Review ${currentYear}: Real Uptime & Speed Test | MonitorMyHost`.slice(0, 60);
          const desc = `${provider} averaged ${rev.headline?.uptime ?? 99.9}% uptime and ${Math.round(rev.headline?.avgResponseTime ?? 300)}ms response across ${rev.headline?.totalChecks ?? 100} checks. Read our expert review.`.slice(0, 155);
          const canonical = `https://monitormyhost.com${reviewPath}`;
          const headInjections = [
            `<title>${escapeHtml(title)}</title>`,
            `<meta name="description" content="${escapeAttr(desc)}" />`,
            `<link rel="canonical" href="${canonical}" />`,
            `<meta property="og:title" content="${escapeAttr(title)}" />`,
            `<meta property="og:description" content="${escapeAttr(desc)}" />`,
            `<meta property="og:url" content="${canonical}" />`,
            `<meta property="og:type" content="article" />`,
            `<meta property="og:site_name" content="MonitorMyHost" />`,
            `<meta property="og:image" content="${escapeAttr(rev.extra?.logoUrl || 'https://monitormyhost.com/og-image.png')}" />`,
            `<meta name="twitter:card" content="summary_large_image" />`,
            `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
            `<meta name="twitter:description" content="${escapeAttr(desc)}" />`,
            `<meta name="twitter:image" content="${escapeAttr(rev.extra?.logoUrl || 'https://monitormyhost.com/og-image.png')}" />`,
          ].join('\n    ');

          let pageHtml = rawTemplate;
          pageHtml = pageHtml.replace(/<title>[\s\S]*?<\/title>/i, '');
          pageHtml = pageHtml.replace(/<meta\s+name=["']description["'][\s\S]*?>/i, '');
          pageHtml = pageHtml.replace('</head>', `  ${headInjections}\n  </head>`);
          pageHtml = pageHtml.replace(
            '<div id="root"></div>',
            `<div id="root" data-prerendered-path="${reviewPath}">${appHtml}</div>`,
          );
          const outDir = path.resolve(`dist${reviewPath}`);
          fs.mkdirSync(outDir, { recursive: true });
          fs.writeFileSync(path.join(outDir, 'index.html'), pageHtml, 'utf-8');
          dynamicReviewRoutes.push({
            canonical,
            changefreq: 'weekly',
            priority: 0.8,
          });
        }
      }
    }
  } catch {
    console.log('[prerender] Backend API not reachable during build; skipped prerendering dynamic review slugs.');
  }

  // Step 4: Generate Sitemap and Robots
  console.log('[prerender] Generating sitemap.xml and robots.txt...');
  fs.writeFileSync(path.resolve('dist/sitemap.xml'), generateSitemapXml(dynamicReviewRoutes), 'utf-8');
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
