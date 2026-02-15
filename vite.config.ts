import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

/**
 * Dev-only middleware: proxies website scrape requests to avoid CORS.
 * POST /api/scrape { url: "https://example.com" } → returns raw HTML
 */
function scraperProxy(): Plugin {
  return {
    name: 'scraper-proxy',
    configureServer(server) {
      server.middlewares.use('/api/scrape', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        for await (const chunk of req) body += chunk;

        try {
          const { url } = JSON.parse(body);
          if (!url) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'url required' }));
            return;
          }

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; AwesomateBot/1.0)',
              'Accept': 'text/html,application/xhtml+xml',
            },
            signal: AbortSignal.timeout(10000),
            redirect: 'follow',
          });

          const html = await response.text();

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ html, status: response.status }));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Fetch failed';
          res.statusCode = 502;
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), scraperProxy()],
  server: {
    port: 3050,
    open: true,
  },
});
