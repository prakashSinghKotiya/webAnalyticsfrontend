/**
 * MonitorMyHost SEO Routes Configuration
 * Single source of truth for:
 *  - Prerendering canonical public routes
 *  - Per-route <head> metadata (title, description, canonical, OG, Twitter)
 *  - Structured Data (Organization + WebSite on home; WebApplication on tools; NO FAQPage JSON-LD)
 *  - Visible FAQs and explanatory content for tool pages
 *  - robots.txt and sitemap.xml generation
 */

export const CANONICAL_HOST = 'https://monitormyhost.com';
export const APP_HOST = 'https://webpulse.monitormyhost.com';

export const PUBLIC_ROUTES = [
  {
    path: '/',
    canonical: `${CANONICAL_HOST}`,
    title: 'MonitorMyHost — Global Website Performance, TTFB & Uptime Monitoring',
    description: 'Monitor global Time to First Byte (TTFB), Google Lighthouse scores, multi-region uptime, DNS records, and redirects from edge probe locations worldwide.',
    keywords: 'server monitoring, website uptime monitor, synthetic monitoring, global TTFB test, multi-region ping, downtime alerts, website latency, DNS lookup, lighthouse audit, web performance telemetry',
    h1: 'Precision Global Web Performance & Edge Monitoring',
    summary: 'Monitor server response times, uptime, Core Web Vitals, and DNS health in real time across distributed global probe nodes.',
    sitemap: {
      changefreq: 'daily',
      priority: 1.0,
    },
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'MonitorMyHost',
        url: CANONICAL_HOST,
        logo: `${CANONICAL_HOST}/favicon.svg`,
        description: 'Global web performance and synthetic uptime monitoring platform operating multi-region edge diagnostic probes.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'MonitorMyHost',
        url: CANONICAL_HOST,
        description: 'Real-time edge telemetry, global TTFB testing, uptime monitoring, and website diagnostics.',
      },
    ],
  },
  {
    path: '/tools/ttfb',
    canonical: `${CANONICAL_HOST}/tools/ttfb`,
    toolId: 'ttfb',
    title: 'MonitorMyHost — Global Website Performance, TTFB & Uptime Monitoring',
    ogTitle: 'Free TTFB Test — Measure Global Time to First Byte Latency | MonitorMyHost',
    twitterTitle: 'Free TTFB Test — Measure Global Time to First Byte Latency | MonitorMyHost',
    description: 'Free Time to First Byte (TTFB) test. Measure server response time, DNS lookup, TLS handshake, and edge latency across global probe locations instantly.',
    keywords: 'free TTFB test, time to first byte, server response time, measure ttfb, website latency check, edge probe speed',
    h1: 'Free Global Time to First Byte (TTFB) Test',
    summary: 'Evaluate server response speed, TLS handshake negotiation, and first-byte latency from North America, Europe, and Asia-Pacific edge probes.',
    sitemap: {
      changefreq: 'weekly',
      priority: 0.9,
    },
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'MonitorMyHost Free TTFB Latency Tester',
        url: `${CANONICAL_HOST}/tools/ttfb`,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'All',
        description: 'Free Time to First Byte (TTFB) speed test measuring origin server response times and TLS handshakes across worldwide edge nodes.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
    explanation: {
      overview: 'Time to First Byte (TTFB) measures the duration from the user making an HTTP request to the browser receiving the first byte of data from the origin server. A low TTFB ensures that the browser can start parsing HTML and requesting critical render assets immediately.',
      importance: [
        'Core Web Vitals Impact: TTFB accounts for up to 40% of Largest Contentful Paint (LCP) delays.',
        'Search Engine Crawling: Fast first-byte delivery allows search engine bots to crawl more pages within their allocated crawl budget.',
        'Edge Routing Efficiency: Identifies origin latency bottlenecks versus Content Delivery Network (CDN) cache hit times.',
      ],
      benchmarks: [
        { label: 'Good', range: '< 200 ms', color: '#00ff88', note: 'Optimal edge or cached origin response' },
        { label: 'Needs Improvement', range: '200 ms - 600 ms', color: '#ffb700', note: 'Noticeable origin processing or routing delay' },
        { label: 'Poor', range: '> 600 ms', color: '#ff4d4d', note: 'Server bottleneck, blocking LCP milestone' },
      ],
    },
    faqs: [
      {
        question: 'What is Time to First Byte (TTFB) and why does it matter?',
        answer: 'TTFB is the total time elapsed between the client sending an HTTP request and receiving the first byte of the response. It combines DNS resolution, TCP connection setup, TLS negotiation, and origin server processing time. A fast TTFB is the prerequisite for fast page rendering.',
      },
      {
        question: 'What is considered a good TTFB score?',
        answer: 'According to Google Core Web Vitals guidelines, a TTFB under 200 ms is considered good. A score between 200 ms and 600 ms needs improvement, while anything above 600 ms is considered poor and likely degrades Core Web Vitals.',
      },
      {
        question: 'How does MonitorMyHost measure TTFB across regions?',
        answer: 'MonitorMyHost dispatches concurrent diagnostic requests from autonomous probe nodes in North America, Europe, and Asia. Each probe measures the raw network round-trip and server response time without client-side caching interference.',
      },
      {
        question: 'How can I reduce my website’s TTFB?',
        answer: 'Key optimizations include enabling full-page edge caching via a CDN, upgrading hosting infrastructure, optimizing slow backend database queries, enabling HTTP/3 and TLS 1.3 session resumption, and reducing origin application overhead.',
      },
    ],
  },
  {
    path: '/tools/lighthouse',
    canonical: `${CANONICAL_HOST}/tools/lighthouse`,
    toolId: 'lighthouse',
    title: 'MonitorMyHost — Global Website Performance, TTFB & Uptime Monitoring',
    ogTitle: 'Free Website Audit & Lighthouse Performance Report | MonitorMyHost',
    twitterTitle: 'Free Website Audit & Lighthouse Performance Report | MonitorMyHost',
    description: 'Run free Google Lighthouse audits for Performance, Accessibility, Best Practices, and SEO. Diagnose Core Web Vitals (LCP, CLS, FCP) on mobile and desktop.',
    keywords: 'website audit, google lighthouse test, free performance report, core web vitals check, seo audit, mobile speed test',
    h1: 'Free Google Lighthouse Performance & SEO Audit',
    summary: 'Audit page experience, Core Web Vitals metrics, semantic markup, and security best practices with automated Google Lighthouse diagnostics.',
    sitemap: {
      changefreq: 'weekly',
      priority: 0.9,
    },
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'MonitorMyHost Lighthouse Performance Auditor',
        url: `${CANONICAL_HOST}/tools/lighthouse`,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'All',
        description: 'Instant Google Lighthouse website audit measuring Core Web Vitals, Performance, Accessibility, Best Practices, and SEO scores.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
    explanation: {
      overview: 'Google Lighthouse provides automated auditing of web pages across five crucial quality dimensions: Performance, Accessibility, Best Practices, SEO, and PWA capabilities. MonitorMyHost runs these audits on simulated mobile or desktop profiles to deliver actionable diagnostics.',
      importance: [
        'Google Page Experience Signal: Core Web Vitals (LCP, CLS, INP) directly influence organic search rankings.',
        'Conversion Rate Optimization: Every 100ms improvement in page speed directly improves user retention and checkout completions.',
        'Accessibility & Compliance: Identifies color contrast, ARIA landmarks, and accessibility defects that exclude visitors.',
      ],
      benchmarks: [
        { label: '90 - 100', range: 'Good (Green)', color: '#00ff88', note: 'Top tier experience matching best practices' },
        { label: '50 - 89', range: 'Needs Improvement (Orange)', color: '#ffb700', note: 'Optimization opportunities detected' },
        { label: '0 - 49', range: 'Poor (Red)', color: '#ff4d4d', note: 'Critical performance or accessibility defects' },
      ],
    },
    faqs: [
      {
        question: 'What metrics are evaluated in a Lighthouse audit?',
        answer: 'Lighthouse tests Core Web Vitals including Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), First Contentful Paint (FCP), Total Blocking Time (TBT), and Speed Index, along with audits for Accessibility, Best Practices, and SEO.',
      },
      {
        question: 'Why do mobile Lighthouse scores differ from desktop?',
        answer: 'Mobile audits simulate a mid-tier mobile device (Moto G4) on a throttled 4G connection. Slower CPU processing and constrained bandwidth highlight script execution bottlenecks that high-powered desktop computers easily mask.',
      },
      {
        question: 'How often should I run a website performance audit?',
        answer: 'High-traffic websites should audit performance after every production release and maintain continuous synthetic monitoring to detect regressions in bundle size or third-party tag latency.',
      },
    ],
  },
  {
    path: '/tools/dns',
    canonical: `${CANONICAL_HOST}/tools/dns`,
    toolId: 'dns',
    title: 'MonitorMyHost — Global Website Performance, TTFB & Uptime Monitoring',
    ogTitle: 'Free DNS Lookup — Check A, AAAA, MX, CNAME & TXT Records | MonitorMyHost',
    twitterTitle: 'Free DNS Lookup — Check A, AAAA, MX, CNAME & TXT Records | MonitorMyHost',
    description: 'Instant authoritative DNS record lookup. Inspect A, AAAA, CNAME, MX, TXT, NS, and SOA records to verify domain routing, email deliverability, and DNS propagation.',
    keywords: 'DNS lookup, check dns records, mx record lookup, txt record verification, spf dkim check, dns propagation test',
    h1: 'Authoritative DNS Record Lookup & Inspector',
    summary: 'Query live DNS records across authoritative nameservers to verify domain mapping, mail exchanger priority, SPF/DKIM verification, and security records.',
    sitemap: {
      changefreq: 'weekly',
      priority: 0.9,
    },
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'MonitorMyHost DNS Record Inspector',
        url: `${CANONICAL_HOST}/tools/dns`,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'All',
        description: 'Authoritative DNS lookup tool to inspect A, AAAA, CNAME, MX, TXT, NS, and PTR records for any domain worldwide.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
    explanation: {
      overview: 'The Domain Name System (DNS) translates human-readable hostnames into machine-routable IP addresses. Inspecting DNS records verifies that traffic routes to correct servers, mail systems accept messages without rejection, and security policies are active.',
      importance: [
        'Email Deliverability: Valid MX, SPF, DKIM, and DMARC TXT records prevent emails from landing in spam folders.',
        'Traffic Routing & Redundancy: Verifies round-robin A/AAAA records and CDN CNAME pointers.',
        'Zero Downtime Migrations: Track TTL (Time to Live) values before DNS migrations to ensure seamless IP transitions.',
      ],
      benchmarks: [
        { label: 'A / AAAA', range: 'IPv4 & IPv6', color: '#00e5ff', note: 'Maps hostname directly to host machine IP address' },
        { label: 'MX', range: 'Mail Exchange', color: '#aa3bff', note: 'Specifies mail servers responsible for accepting incoming emails' },
        { label: 'TXT', range: 'Verification', color: '#00ff88', note: 'Holds SPF, DKIM, Google Search Console, and SSL verification tokens' },
      ],
    },
    faqs: [
      {
        question: 'What is a DNS record and what types are supported?',
        answer: 'DNS records are database instructions on authoritative DNS servers. MonitorMyHost queries A (IPv4), AAAA (IPv6), CNAME (canonical alias), MX (mail servers), TXT (domain verification, SPF, DKIM), NS (nameservers), and SOA (zone authority).',
      },
      {
        question: 'How long does DNS propagation take?',
        answer: 'DNS changes take between a few minutes up to 48 hours to propagate worldwide, governed by the record’s TTL (Time to Live) value set by the domain administrator.',
      },
      {
        question: 'Why are my email MX or TXT records failing?',
        answer: 'Common causes include typos in priority values, missing trailing dots on hostnames, syntax errors in SPF strings, or DNS registrar caching delays.',
      },
    ],
  },
  {
    path: '/tools/redirects',
    canonical: `${CANONICAL_HOST}/tools/redirects`,
    toolId: 'redirects',
    title: 'MonitorMyHost — Global Website Performance, TTFB & Uptime Monitoring',
    ogTitle: 'Free Redirect Checker — HTTP 301/302 Redirect Chain Tracer | MonitorMyHost',
    twitterTitle: 'Free Redirect Checker — HTTP 301/302 Redirect Chain Tracer | MonitorMyHost',
    description: 'Trace complete HTTP redirect chains, 301 permanent moves, 302 temporary redirects, and meta refreshes. Detect redirect loops and preserve SEO link equity.',
    keywords: 'redirect checker, trace redirects, 301 redirect test, 302 redirect chain, redirect loop detector, http status code tracer',
    h1: 'HTTP Redirect Chain Checker & Status Tracer',
    summary: 'Trace every hop in an HTTP redirection path, verify status codes (301, 302, 307, 308), uncover infinite loops, and prevent SEO link equity degradation.',
    sitemap: {
      changefreq: 'weekly',
      priority: 0.9,
    },
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'MonitorMyHost HTTP Redirect Tracer',
        url: `${CANONICAL_HOST}/tools/redirects`,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'All',
        description: 'Free HTTP redirect chain tracer analyzing 301, 302, 307, and 308 response sequences, status codes, and destination latency.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
    explanation: {
      overview: 'When a web server redirects a request, each hop introduces additional latency and risks dropping search engine ranking signals. MonitorMyHost traces every intermediate hop, response header, and final destination URL in sequence.',
      importance: [
        'Preserving SEO Link Equity: Chains of 3 or more redirects dilute PageRank and may cause crawlers to abandon the path.',
        'Eliminating Redirect Loops: Identifies circular redirects (e.g., HTTP to HTTPS and back) that block users with browser errors.',
        'Site Migration Verification: Confirms old URLs 301-redirect cleanly to their exact counterparts without intermediate hops.',
      ],
      benchmarks: [
        { label: '301 Moved Permanently', range: 'Permanent', color: '#00ff88', note: 'Passes 90-99% of link equity to destination URL' },
        { label: '302 Found / 307', range: 'Temporary', color: '#00e5ff', note: 'Does not transfer canonical ranking signals' },
        { label: 'Chain > 2 Hops', range: 'Warning', color: '#ffb700', note: 'Increases latency; consolidate into a single direct 301' },
      ],
    },
    faqs: [
      {
        question: 'What is the difference between a 301 and a 302 redirect?',
        answer: 'A 301 redirect signifies a permanent move, instructing search engines to transfer rankings and link equity to the new URL. A 302 redirect signifies a temporary move and keeps the original URL indexed.',
      },
      {
        question: 'Why are redirect chains harmful for SEO and performance?',
        answer: 'Each hop in a redirect chain forces a new DNS lookup, TCP handshake, TLS negotiation, and server response. This compounds TTFB latency, wastes crawl budget, and increases the likelihood that crawlers drop the destination page.',
      },
      {
        question: 'How do I resolve a redirect loop?',
        answer: 'Check server configuration files (.htaccess, Nginx configs, Cloudflare SSL mode). A common cause is configuring Cloudflare SSL to Flexible while the origin server enforces HTTPS, causing an infinite redirect loop.',
      },
    ],
  },
  {
    path: '/tools/whois',
    canonical: `${CANONICAL_HOST}/tools/whois`,
    toolId: 'whois',
    title: 'MonitorMyHost — Global Website Performance, TTFB & Uptime Monitoring',
    ogTitle: 'Free WHOIS Lookup — Domain Registrar & Expiry Intelligence | MonitorMyHost',
    twitterTitle: 'Free WHOIS Lookup — Domain Registrar & Expiry Intelligence | MonitorMyHost',
    description: 'Instant WHOIS lookup tool. Inspect domain registration dates, expiration status, registrar information, DNSSEC, and authoritative nameservers.',
    keywords: 'whois lookup, domain whois check, domain expiration date, domain registrar lookup, check domain ownership, nameserver lookup',
    h1: 'Authoritative WHOIS Domain Intelligence & Expiry Lookup',
    summary: 'Lookup official domain registration records, creation dates, upcoming expiration milestones, registrar locks, and authoritative nameserver delegations.',
    sitemap: {
      changefreq: 'weekly',
      priority: 0.9,
    },
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'MonitorMyHost WHOIS Domain Lookup',
        url: `${CANONICAL_HOST}/tools/whois`,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'All',
        description: 'Authoritative WHOIS search utility providing registrar details, domain status codes, expiration dates, and nameservers.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
    explanation: {
      overview: 'WHOIS is a standardized protocol querying databases that store registered users or assignees of an Internet resource, such as domain names and IP address blocks. It provides critical operational and security intelligence.',
      importance: [
        'Domain Expiration Protection: Prevent accidental lapses in domain registration that could take your entire platform offline.',
        'Transfer & Lock Status: Check whether clientTransferProhibited locks are active to protect against unauthorized domain hijacking.',
        'Infrastructure Identification: Verify authoritative nameservers and registrar organization details.',
      ],
      benchmarks: [
        { label: 'Active / OK', range: 'Normal', color: '#00ff88', note: 'Domain is fully operational and delegated' },
        { label: 'clientTransferProhibited', range: 'Protected', color: '#00e5ff', note: 'Registrar lock active against unauthorized transfers' },
        { label: 'Redemption Period', range: 'Critical', color: '#ff4d4d', note: 'Domain expired; owner must pay restoration fee before public release' },
      ],
    },
    faqs: [
      {
        question: 'What information does a WHOIS query return?',
        answer: 'A WHOIS query returns domain creation, update, and expiration dates, registrar name, registrar WHOIS server, domain status codes, and authoritative nameservers. Personal registrant details may be redacted under privacy laws (GDPR).',
      },
      {
        question: 'Why is registrant personal information hidden in WHOIS?',
        answer: 'To comply with privacy regulations such as GDPR and CCPA, most domain registrars now apply proxy privacy services that redact personal emails, phone numbers, and physical addresses from public records.',
      },
      {
        question: 'What should I do if my domain is in redemption period?',
        answer: 'If a domain is in the redemption period (typically 30 days after expiration), contact the registrar immediately to pay the redemption fee before the domain enters pending-delete status and becomes available for public re-registration.',
      },
    ],
  },
  {
    path: '/about',
    canonical: `${CANONICAL_HOST}/about`,
    title: 'About MonitorMyHost — Global Server Uptime & Web Performance Platform',
    description: 'Learn about MonitorMyHost, our distributed edge probe network across 6+ continents, and our mission to deliver sub-second server uptime and TTFB diagnostics worldwide.',
    keywords: 'about MonitorMyHost, website uptime monitoring, server performance monitor, global probe network, synthetic monitoring platform, TTFB tester, developer website monitoring, web infrastructure monitoring, cloud uptime SLA',
    h1: 'Pioneering High-Precision Server & Uptime Telemetry',
    summary: 'MonitorMyHost delivers real-time visibility into server response times, uptime availability, SSL certificate health, and Core Web Vitals from distributed probe nodes worldwide.',
    sitemap: {
      changefreq: 'monthly',
      priority: 0.8,
    },
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About MonitorMyHost',
        url: `${CANONICAL_HOST}/about`,
        description: 'Comprehensive overview of MonitorMyHost, our distributed global probe infrastructure, and our synthetic website and server monitoring architecture.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'MonitorMyHost',
        url: CANONICAL_HOST,
        logo: `${CANONICAL_HOST}/favicon.svg`,
        description: 'Global web performance and synthetic uptime monitoring platform operating multi-region edge diagnostic probes.',
        sameAs: [
          'https://twitter.com',
          'https://github.com',
          'https://linkedin.com',
        ],
      },
    ],
  },
  {
    path: '/contact',
    canonical: `${CANONICAL_HOST}/contact`,
    title: 'Contact Us — Technical Support & Sales Inquiries | MonitorMyHost',
    description: 'Get in touch with the MonitorMyHost team. Reach out for 24/7 technical support, custom enterprise uptime monitoring, API questions, or feedback.',
    keywords: 'contact MonitorMyHost, website monitoring support, server monitoring inquiry, uptime help desk, developer support, enterprise uptime monitoring, monitoring SLA',
    h1: 'Contact MonitorMyHost Support & Inquiries',
    summary: 'Have questions about global server telemetry, multi-region synthetic uptime monitoring, or enterprise SLA plans? Our technical team is here to assist.',
    sitemap: {
      changefreq: 'monthly',
      priority: 0.8,
    },
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'MonitorMyHost Contact & Support',
        url: `${CANONICAL_HOST}/contact`,
        description: 'Direct contact channels for technical assistance, uptime alerts configuration, and platform inquiries.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'MonitorMyHost',
        url: CANONICAL_HOST,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'support@monitormyhost.com',
          availableLanguage: ['English'],
        },
      },
    ],
  },
];

/**
 * Match a pathname to its canonical route definition
 */
export function getRouteMetadata(pathname = '/') {
  // Normalize: strip trailing slash (except bare '/') and query params
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '').split('?')[0];
  const matched = PUBLIC_ROUTES.find((r) => r.path === cleanPath);
  return matched || PUBLIC_ROUTES[0];
}

/**
 * Generate XML sitemap containing canonical public URLs
 */
export function generateSitemapXml() {
  const today = new Date().toISOString().split('T')[0];
  const urlsXml = PUBLIC_ROUTES.map(
    (route) => `  <url>
    <loc>${route.canonical}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.sitemap.changefreq}</changefreq>
    <priority>${route.sitemap.priority.toFixed(1)}</priority>
  </url>`,
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
}

/**
 * Generate robots.txt
 * Rule 5: webpulse.monitormyhost.com has noindex via meta + X-Robots-Tag header,
 * and must NOT be Disallowed in robots.txt so crawlers can discover the noindex header.
 */
export function generateRobotsTxt() {
  return `# MonitorMyHost Robots Policy
User-agent: *
Allow: /

# Canonical Sitemap (public canonical routes)
Sitemap: ${CANONICAL_HOST}/sitemap.xml
`;
}

/**
 * Get list of paths for build-time static prerendering
 */
export function getPrerenderRoutes() {
  return PUBLIC_ROUTES.map((r) => r.path);
}

export default PUBLIC_ROUTES;

