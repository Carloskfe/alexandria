import { Injectable } from '@nestjs/common';

interface WikisourceParseResponse {
  parse?: { text?: string; links?: Array<{ title?: string; ns?: number }> };
  error?: { info: string };
}

@Injectable()
export class WikisourceFetcherService {
  /**
   * Fetches the full text of a Wikisource book. Wikisource structures long
   * works as an index page with per-chapter subpages (e.g. "Title/I",
   * "Title/Capítulo 1"). We detect subpages via the index page's link list
   * and concatenate every chapter; if none exist we fall back to the single
   * page. This avoids returning the raw index metadata instead of book text.
   */
  async fetch(pageTitle: string): Promise<string> {
    const subpages = await this.listSubpages(pageTitle);

    if (subpages.length === 0) {
      return this.fetchPageHtml(pageTitle);
    }

    const parts: string[] = [];
    for (const sub of subpages) {
      await this.sleep(400);
      try {
        const text = await this.fetchPageHtml(sub);
        if (text.trim().length > 100) parts.push(text);
      } catch {
        // skip chapters that can't be fetched
      }
    }

    return parts.length > 0 ? parts.join('\n\n') : this.fetchPageHtml(pageTitle);
  }

  private readonly headers = {
    'User-Agent': 'Alexandria-Ingestion/1.0 (https://github.com/Carloskfe/alexandria)',
  };

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async listSubpages(pageTitle: string): Promise<string[]> {
    const encoded = encodeURIComponent(pageTitle);
    const url =
      `https://es.wikisource.org/w/api.php` +
      `?action=parse&page=${encoded}&prop=links&format=json&formatversion=2`;
    const res = await globalThis.fetch(url, { headers: this.headers });
    if (!res.ok) return [];
    const data = (await res.json()) as WikisourceParseResponse;
    return (data.parse?.links ?? [])
      .filter((l) => typeof l.title === 'string' && l.title.startsWith(`${pageTitle}/`))
      .map((l) => l.title as string)
      .sort();
  }

  private async fetchPageHtml(pageTitle: string): Promise<string> {
    const encoded = encodeURIComponent(pageTitle);
    const url =
      `https://es.wikisource.org/w/api.php` +
      `?action=parse&page=${encoded}&prop=text&format=json&formatversion=2`;
    const res = await globalThis.fetch(url, { headers: this.headers });
    if (!res.ok) {
      throw new Error(`Wikisource fetch failed for "${pageTitle}": HTTP ${res.status}`);
    }
    const data = (await res.json()) as WikisourceParseResponse;
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
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#160;/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
