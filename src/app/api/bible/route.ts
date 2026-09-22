export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get('search');
  const version = searchParams.get('version') || 'NTV';

  if (!search) {
    return NextResponse.json({ success: false, error: 'Missing search parameter' }, { status: 400 });
  }

  try {
    const url = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(search)}&version=${version}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) {
      throw new Error(`BibleGateway responded with ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // BibleGateway usually puts the text inside .passage-text
    const passageNode = $('.passage-text');
    if (!passageNode.length) {
      return NextResponse.json({ success: false, error: 'Passage not found' }, { status: 404 });
    }

    // Clean up unnecessary elements
    passageNode.find('.crossrefs, .footnotes, .publisher-info-bottom, .crossreference').remove();
    
    // We want to return the raw HTML to preserve paragraphs and verse numbers
    // but clean it up to match our theme
    // Protect chapter numbers
    passageNode.find('.chapternum').each((i, el) => {
      $(el).replaceWith('<b data-type="chapternum">' + $(el).html() + '</b>');
    });
    
    passageNode.find('*').removeAttr('style').removeAttr('class').removeAttr('id');
    
    // Restore chapternum class
    passageNode.find('b[data-type="chapternum"]').addClass('chapternum').removeAttr('data-type');
    
    // Replace span with <sup> for verse numbers (if they are just spans now)
    // Actually, preserving the clean HTML is best.
    let cleanHtml = '';
    passageNode.each((i, el) => {
      cleanHtml += $(el).html()?.trim() + '<br/>';
    });

    // Also get the canonical reference title
    const title = $('.bcv').first().text().trim() || search;

    return NextResponse.json({ 
      success: true, 
      data: {
        title,
        html: cleanHtml,
        version
      }
    });

  } catch (error: any) {
    console.error('Bible Scraper Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}