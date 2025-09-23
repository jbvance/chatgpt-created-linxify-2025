// app/api/scrape/route.js
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Utility to resolve absolute URLs
function resolveUrl(base, relative) {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'LinxifyBot/1.0' },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch URL' },
        { status: 400 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const title =
      $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';
    const favicon =
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      '/favicon.ico';
    const image = $('meta[property="og:image"]').attr('content') || null;

    return NextResponse.json({
      title: title.trim(),
      description: description.trim(),
      favicon: resolveUrl(url, favicon),
      image: image ? resolveUrl(url, image) : null,
    });
  } catch (err) {
    console.error('Scrape error:', err);
    return NextResponse.json({ error: 'Scraping failed' }, { status: 500 });
  }
}
