import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { PUBLIC_ROUTES, generateSitemapXml, generateRobotsTxt, buildReviewDetailMetadata } from '../src/seo/routes.js';
import { fetchPublishedReviews, fetchReviewBySlug } from '../src/data/seedReviews.js';

async function prerender() {
  console.log('[prerender] Starting MonitorMyHost static prerendering pipeline...');

  const templatePath = path.resolve('dist/index.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error('dist/index.html not found. Ensure "vite build" runs before prerender.');
  }
  const rawTemplate = fs.readFileSync(templatePath, 'utf-8');

  // Step 1: Pre-fetch review data (with localhost -> production -> seed fallback)
  console.log('[prerender] Fetching published reviews data for prerendering...');
  const { data: publishedReviews, pagination: reviewsPagination, source: reviewsSource } = await fetchPublishedReviews();
  console.log(`[prerender] Loaded ${publishedReviews.length} published reviews (source: ${reviewsSource}).`);

  // Step 2: Compile SSR bundle using Vite
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

  // Step 3: Prerender each of the canonical public routes
  console.log(`[prerender] Generating ${PUBLIC_ROUTES.length} canonical public pages...`);
  for (const route of PUBLIC_ROUTES) {
    console.log(`[prerender] -> Prerendering ${route.path}...`);

    let initialData = null;
    if (route.path === '/reviews') {
      initialData = {
        url: '/reviews',
        reviewsList: {
          reviews: publishedReviews,
          pagination: reviewsPagination,
        },
      };
    }

    const appHtml = render(route.path, initialData);

    // Build head tags to inject
    const headInjectionsList = [
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
    ];

    if (initialData) {
      headInjectionsList.push(
        `<script id="__INITIAL_DATA__">window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`,
      );
    }

    const headInjections = headInjectionsList.join('\n    ');

    // Replace default head elements
    let pageHtml = rawTemplate;

    // Replace title
    if (pageHtml.includes('<title>')) {
      pageHtml = pageHtml.replace(/<title>[\s\S]*?<\/title>/i, '');
    }
    // Replace default description
    pageHtml = pageHtml.replace(/<meta\s+name=["']description["'][\s\S]*?>/i, '');

    // Inject rich head metadata right before </head>
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

    safeWriteFileSync(outFilePath, pageHtml);
    const sizeKb = (Buffer.byteLength(pageHtml, 'utf-8') / 1024).toFixed(2);
    console.log(`[prerender]    Generated ${path.relative(process.cwd(), outFilePath)} (${sizeKb} kB)`);
  }

  // Step 4: Prerender 404 page for cPanel ErrorDocument 404
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
  safeWriteFileSync(path.resolve('dist/404.html'), notFoundPage);
  console.log('[prerender]    Generated dist/404.html');

  // Step 5: Prerender dynamic review detail pages (/reviews/:slug)
  const dynamicReviewRoutes = [];
  console.log(`[prerender] Prerendering ${publishedReviews.length} individual hosting review detail pages...`);
  for (const rev of publishedReviews) {
    if (!rev.slug) continue;
    const reviewPath = `/reviews/${rev.slug}`;
    console.log(`[prerender] -> Prerendering dynamic review ${reviewPath}...`);

    const detailRes = await fetchReviewBySlug(rev.slug);
    const fullReview = detailRes?.data || rev;
    const moreReviews = publishedReviews.filter((r) => r.slug !== rev.slug).slice(0, 3);

    const initialData = {
      url: reviewPath,
      reviewDetail: fullReview,
      moreReviews,
    };

    const appHtml = render(reviewPath, initialData);
    const seo = buildReviewDetailMetadata(fullReview, rev.slug);

    const headInjections = [
      `<title>${escapeHtml(seo.title)}</title>`,
      `<meta name="description" content="${escapeAttr(seo.description)}" />`,
      `<meta name="keywords" content="${escapeAttr(seo.keywords)}" />`,
      `<link rel="canonical" href="${seo.canonical}" />`,
      `<meta property="og:title" content="${escapeAttr(seo.ogTitle || seo.title)}" />`,
      `<meta property="og:description" content="${escapeAttr(seo.description)}" />`,
      `<meta property="og:url" content="${seo.canonical}" />`,
      `<meta property="og:type" content="${escapeAttr(seo.ogType || 'article')}" />`,
      `<meta property="og:site_name" content="MonitorMyHost" />`,
      `<meta property="og:image" content="${escapeAttr(seo.ogImage || 'https://monitormyhost.com/og-image.png')}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeAttr(seo.twitterTitle || seo.title)}" />`,
      `<meta name="twitter:description" content="${escapeAttr(seo.description)}" />`,
      `<meta name="twitter:image" content="${escapeAttr(seo.ogImage || 'https://monitormyhost.com/og-image.png')}" />`,
      `<script id="json-ld-seo-live" type="application/ld+json">${JSON.stringify(seo.structuredData)}</script>`,
      `<script id="__INITIAL_DATA__">window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`,
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
    const outFilePath = path.join(outDir, 'index.html');
    safeWriteFileSync(outFilePath, pageHtml);
    const sizeKb = (Buffer.byteLength(pageHtml, 'utf-8') / 1024).toFixed(2);
    console.log(`[prerender]    Generated ${path.relative(process.cwd(), outFilePath)} (${sizeKb} kB)`);

    dynamicReviewRoutes.push({
      canonical: seo.canonical,
      changefreq: 'weekly',
      priority: 0.8,
    });
  }

  // Step 5.5: Generate backward-compatible static redirect HTML pages for /hosting-reviews
  console.log('[prerender] Generating backward-compatible static redirect HTML files for legacy /hosting-reviews routes...');
  const makeRedirectHtml = (targetUrl, canonicalUrl) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="robots" content="noindex, follow" />
  <meta http-equiv="refresh" content="0; url=${escapeAttr(targetUrl)}" />
  <link rel="canonical" href="${escapeAttr(canonicalUrl)}" />
  <title>Redirecting to ${escapeHtml(targetUrl)}...</title>
  <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</head>
<body>
  <p>Page moved permanently. Redirecting to <a href="${escapeAttr(targetUrl)}">${escapeHtml(targetUrl)}</a>...</p>
</body>
</html>`;

  // Legacy list redirect: /hosting-reviews/index.html -> /reviews
  const legacyListDir = path.resolve('dist/hosting-reviews');
  fs.mkdirSync(legacyListDir, { recursive: true });
  safeWriteFileSync(
    path.join(legacyListDir, 'index.html'),
    makeRedirectHtml('/reviews', 'https://monitormyhost.com/reviews'),
  );

  // Legacy review detail redirects: /hosting-reviews/:slug/index.html -> /reviews/:slug
  for (const rev of publishedReviews) {
    if (!rev.slug) continue;
    const legacySlugDir = path.join(legacyListDir, rev.slug);
    fs.mkdirSync(legacySlugDir, { recursive: true });
    safeWriteFileSync(
      path.join(legacySlugDir, 'index.html'),
      makeRedirectHtml(`/reviews/${rev.slug}`, `https://monitormyhost.com/reviews/${rev.slug}`),
    );
  }
  console.log(`[prerender]    Generated ${publishedReviews.length + 1} backward-compatible static redirect files in dist/hosting-reviews/`);

  // Step 6: Generate Sitemap and Robots
  console.log('[prerender] Generating sitemap.xml and robots.txt...');
  safeWriteFileSync(path.resolve('dist/sitemap.xml'), generateSitemapXml(dynamicReviewRoutes));
  safeWriteFileSync(path.resolve('dist/robots.txt'), generateRobotsTxt());
  console.log('[prerender]    Generated dist/sitemap.xml and dist/robots.txt');

  // Step 7: Clean up temporary SSR bundle
  if (fs.existsSync(path.resolve('dist-ssr'))) {
    fs.rmSync(path.resolve('dist-ssr'), { recursive: true, force: true });
    console.log('[prerender] Cleaned up temporary dist-ssr directory.');
  }

  console.log('[prerender] Static prerendering complete successfully!');
}

function escapeHtml(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str = '') {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeWriteFileSync(filePath, content, retries = 5, delayMs = 150) {
  for (let i = 0; i < retries; i++) {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return;
    } catch (err) {
      if ((err.code === 'EBUSY' || err.code === 'EPERM') && i < retries - 1) {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs);
        continue;
      }
      throw err;
    }
  }
}

prerender().catch((err) => {
  console.error('[prerender] FAILED:', err);
  process.exit(1);
});
