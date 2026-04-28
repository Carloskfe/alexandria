import { Injectable } from '@nestjs/common';

interface WikisourceApiResponse {
  parse?: { text?: string };
  error?: { info: string };
}

@Injectable()
export class WikisourceFetcherService {
  async fetch(pageTitle: string): Promise<string> {
    const encoded = encodeURIComponent(pageTitle);
    const url = `https://es.wikisource.org/w/api.php?action=parse&page=${encoded}&prop=text&format=json&formatversion=2`;
    const res = await globalThis.fetch(url);
    if (!res.ok) {
      throw new Error(`Wikisource fetch failed for "${pageTitle}": HTTP ${res.status}`);
    }
    const data = (await res.json()) as WikisourceApiResponse;
    if (data.error) {
      throw new Error(`Wikisource API error for "${pageTitle}": ${data.error.info}`);
    }
    if (!data.parse?.text) {
      throw new Error(`No text returned by Wikisource for "${pageTitle}"`);
    }
    return this.stripHtml(data.parse.text);
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
