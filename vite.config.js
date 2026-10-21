import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

/**
 * Dev Prerender Plugin
 * Enables full "View Source" in the Vite dev server (npm run dev)
 * so that localhost:5173 serves the exact same rich prerendered HTML,
 * title, h1, FAQs, and JSON-LD as the production build.
 */
function devPrerenderPlugin() {
  const publicPaths = ['/', '/about', '/contact', '/tools/ttfb', '/tools/lighthouse', '/tools/dns', '/tools/redirects', '/tools/whois'];

  return {
    name: 'vite-plugin-dev-prerender',
    apply: 'serve',
    transformIndexHtml: {
      order: 'post',
      async handler(html, ctx) {
        const rawUrl = ctx.originalUrl || ctx.path || '/';
        const cleanPath = rawUrl.split('?')[0].replace(/\/+$/, '') || '/';

        if (!publicPaths.includes(cleanPath)) {
          return html;
        }

        try {
          const { render } = await ctx.server.ssrLoadModule('/src/prerender/entry-server.jsx');
          const { getRouteMetadata } = await ctx.server.ssrLoadModule('/src/seo/routes.js');
          const route = getRouteMetadata(cleanPath);

          const appHtml = render(cleanPath);

          const headInjections = [
            `<title>${route.title}</title>`,
            `<meta name="description" content="${route.description}" />`,
            `<meta name="keywords" content="${route.keywords}" />`,
            `<link rel="canonical" href="${route.canonical}" />`,
            `<meta property="og:title" content="${route.title}" />`,
            `<meta property="og:description" content="${route.description}" />`,
            `<meta property="og:url" content="${route.canonical}" />`,
            `<meta property="og:type" content="website" />`,
            `<meta property="og:site_name" content="MonitorMyHost" />`,
            `<meta property="og:image" content="https://monitormyhost.com/og-image.png" />`,
            `<meta name="twitter:card" content="summary_large_image" />`,
            `<meta name="twitter:title" content="${route.title}" />`,
            `<meta name="twitter:description" content="${route.description}" />`,
            `<meta name="twitter:image" content="https://monitormyhost.com/og-image.png" />`,
            `<script type="application/ld+json">${JSON.stringify(route.structuredData)}</script>`,
          ].join('\n    ');

          let modified = html;
          modified = modified.replace(/<title>[\s\S]*?<\/title>/i, '');
          modified = modified.replace(/<meta\s+name=["']description["'][\s\S]*?>/i, '');
          modified = modified.replace('</head>', `  ${headInjections}\n  </head>`);
          modified = modified.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

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
  plugins: [devPrerenderPlugin(), react(), tailwindcss()],
});
