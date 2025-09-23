// lib/archive.js
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export async function fetchAndArchiveContent(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      console.error(`Archiving failed for ${url}: ${res.statusText}`);
      return null;
    }

    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    return article?.content || null;
  } catch (err) {
    console.error('Archiving error:', err);
    return null;
  }
}
