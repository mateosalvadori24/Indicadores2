import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface NewsItem {
  title: string;
  source: string;
  link: string;
  pubDate: string;
  relativeTime: string;
}

const newsCache = new Map<string, { timestamp: number; items: NewsItem[] }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function decodeXmlEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\u00a0/g, ' ')
    .trim();
}

function formatRelativeSpanish(pubDateStr: string): string {
  const parsed = Date.parse(pubDateStr);
  if (Number.isNaN(parsed)) return 'Reciente';
  const diffMs = Math.max(0, Date.now() - parsed);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) {
    return mins <= 1 ? 'Hace 1 minuto' : `Hace ${mins} minutos`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return hours === 1 ? 'Hace 1 hora' : `Hace ${hours} horas`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return days === 1 ? 'Hace 1 día' : `Hace ${days} días`;
  }
  const months = Math.floor(days / 30);
  return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
}

function parseGoogleNewsRss(xml: string, limit = 4): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const block = match[1];
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/);

    if (!titleMatch || !linkMatch) continue;

    let rawTitle = decodeXmlEntities(titleMatch[1]);
    const source = sourceMatch ? decodeXmlEntities(sourceMatch[1]) : 'Google Noticias';
    if (source && rawTitle.endsWith(` - ${source}`)) {
      rawTitle = rawTitle.slice(0, -(` - ${source}`.length)).trim();
    }

    const link = decodeXmlEntities(linkMatch[1]);
    const pubDate = pubDateMatch ? decodeXmlEntities(pubDateMatch[1]) : '';

    if (rawTitle && link) {
      items.push({
        title: rawTitle,
        source,
        link,
        pubDate,
        relativeTime: formatRelativeSpanish(pubDate),
      });
    }
  }

  return items;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.get('/api/news', async (req, res) => {
    const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const query = rawQuery || 'economía argentina';
    const cacheKey = query.toLowerCase();

    const cached = newsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      res.json({ items: cached.items, cached: true });
      return;
    }

    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
        query
      )}&hl=es-419&gl=AR&ceid=AR:es-419`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(rssUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IndicadoresAR/1.0)',
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`RSS HTTP ${response.status}`);
      }

      const xml = await response.text();
      const items = parseGoogleNewsRss(xml, 4);

      if (items.length > 0) {
        newsCache.set(cacheKey, { timestamp: Date.now(), items });
      }

      res.json({ items, cached: false });
    } catch {
      res.status(502).json({ items: [], error: 'No se pudieron obtener noticias' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Indicadores server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
