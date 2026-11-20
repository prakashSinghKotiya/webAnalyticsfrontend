import fs from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

function escapeHtml(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str = '') {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Preview Prerender Plugin
 * Ensures `npm run preview` cleanly maps clean URLs (such as /reviews/hostinger-review)
 * to their pre-rendered static HTML files instead of falling back to root index.html.
 */
function previewPrerenderPlugin() {
  return {
    name: 'vite-plugin-preview-prerender',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || '/';
        const cleanPath = rawUrl.split('?')[0].replace(/\/+$/, '') || '/';
        if (cleanPath === '/') return next();

        // 1. Direct file: dist/<path>.html
        const directFile = path.resolve(`dist${cleanPath}.html`);
        // 2. Directory index: dist/<path>/index.html
        const dirIndexFile = path.resolve(`dist${cleanPath}/index.html`);

        const targetFile = fs.existsSync(directFile)
          ? directFile
          : fs.existsSync(dirIndexFile)
          ? dirIndexFile
          : null;

        if (targetFile) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          fs.createReadStream(targetFile).pipe(res);
          return;
        }

        next();
      });
    },
  };
}

/**
 * Dev Prerender Plugin
 * Enables full "View Source" in the Vite dev server (npm run dev)
 * so that localhost:5173 serves the exact same rich prerendered HTML,
 * title, h1, FAQs, and JSON-LD as the production build.
 */
function devPrerenderPlugin() {
  const publicPaths = [
    '/',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/privacy-policy',
    '/terms-of-service',
    '/terms-of-use',
    '/ttfb-test',
    '/fullsite-report',
    '/dns-checker',
    '/redirection-checker',
    '/whois-lookup',
    '/reviews',
    '/hosting-reviews',
    '/tools/ttfb',
    '/tools/lighthouse',
    '/tools/dns',
    '/tools/redirects',
    '/tools/whois',
  ];

  return {
    name: 'vite-plugin-dev-prerender',
    apply: 'serve',
    transformIndexHtml: {
      order: 'post',
      async handler(html, ctx) {
        const rawUrl = ctx.originalUrl || ctx.path || '/';
        const cleanPath = rawUrl.split('?')[0].replace(/\/+$/, '') || '/';

        const isPublicPath =
          publicPaths.includes(cleanPath) ||
          cleanPath.startsWith('/reviews/') ||
          cleanPath.startsWith('/hosting-reviews/');
        if (!isPublicPath) {
          return html;
        }

        try {
          const { render } = await ctx.server.ssrLoadModule('/src/prerender/entry-server.jsx');
          const { getRouteMetadata, buildReviewDetailMetadata } = await ctx.server.ssrLoadModule('/src/seo/routes.js');

          let initialData = null;
          let route = null;

          if (cleanPath === '/reviews' || cleanPath === '/hosting-reviews') {
            const { fetchPublishedReviews } = await ctx.server.ssrLoadModule('/src/data/seedReviews.js');
            const { data: publishedReviews, pagination } = await fetchPublishedReviews();
            initialData = {
              url: cleanPath,
              reviewsList: {
                reviews: publishedReviews,
                pagination,
              },
            };
            route = getRouteMetadata('/reviews');
          } else if (cleanPath.startsWith('/reviews/') || cleanPath.startsWith('/hosting-reviews/')) {
            const slug = cleanPath.startsWith('/reviews/')
              ? cleanPath.replace('/reviews/', '')
              : cleanPath.replace('/hosting-reviews/', '');
            const { fetchPublishedReviews, fetchReviewBySlug } = await ctx.server.ssrLoadModule('/src/data/seedReviews.js');
            const { data: publishedReviews } = await fetchPublishedReviews();
            const detailRes = await fetchReviewBySlug(slug);
            const review = detailRes?.data;
            const moreReviews = publishedReviews.filter((r) => r.slug !== slug).slice(0, 3);
            initialData = {
              url: `/reviews/${slug}`,
              reviewDetail: review,
              moreReviews,
            };
            route = review ? buildReviewDetailMetadata(review, slug) : getRouteMetadata(`/reviews/${slug}`);
          } else {
            route = getRouteMetadata(cleanPath);
          }

          const appHtml = render(cleanPath, initialData);

          if (!route) {
            const notFoundHead = [
              '<title>404 — Page Not Found | MonitorMyHost</title>',
              '<meta name="description" content="The page you requested could not be found." />',
              '<meta name="robots" content="noindex, nofollow" />',
            ].join('\n    ');

            let modified = html;
            modified = modified.replace(/<title>[\s\S]*?<\/title>/i, '');
            modified = modified.replace(/<meta\s+name=["']description["'][\s\S]*?>/i, '');
            modified = modified.replace('</head>', `  ${notFoundHead}\n  </head>`);
            modified = modified.replace(
              '<div id="root"></div>',
              `<div id="root" data-prerendered-path="${cleanPath}">${appHtml}</div>`,
            );
            return modified;
          }

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
          ];

          if (route.structuredData) {
            headInjectionsList.push(
              `<script id="json-ld-seo-live" type="application/ld+json">${JSON.stringify(route.structuredData)}</script>`,
            );
          }

          if (initialData) {
            headInjectionsList.push(
              `<script id="__INITIAL_DATA__">window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`,
            );
          }

          const headInjections = headInjectionsList.join('\n    ');

          let modified = html;
          modified = modified.replace(/<title>[\s\S]*?<\/title>/i, '');
          modified = modified.replace(/<meta\s+name=["']description["'][\s\S]*?>/i, '');
          modified = modified.replace('</head>', `  ${headInjections}\n  </head>`);
          modified = modified.replace(
            /<div id="root"[^>]*>[\s\S]*?<\/div>/i,
            `<div id="root" data-prerendered-path="${cleanPath}">${appHtml}</div>`,
          );

          return modified;
        } catch (err) {
          ctx.server.config.logger.error(`[dev-prerender] Error rendering ${cleanPath}: ${err.message}`, { error: err });
          return html;
        }
      },
    },
  };
}

export default defineConfig({
  plugins: [devPrerenderPlugin(), previewPrerenderPlugin(), react(), tailwindcss()],
});
