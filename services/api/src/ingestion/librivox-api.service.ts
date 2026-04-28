import { Injectable } from '@nestjs/common';

@Injectable()
export class LibrivoxApiService {
  /**
   * Fetches the LibriVox book page and extracts the archive.org 64kb MP3 zip URL.
   * Using page scraping rather than the LibriVox API, which is rate-limited.
   */
  async getZipUrl(librivoxPageUrl: string): Promise<string> {
    const res = await globalThis.fetch(librivoxPageUrl);
    if (!res.ok) {
      throw new Error(`LibriVox page fetch failed: HTTP ${res.status} — ${librivoxPageUrl}`);
    }
    const html = await res.text();

    const match = /href="(https:\/\/archive\.org\/compress\/[^"]+\.zip[^"]*)"/i.exec(html);
    if (!match) {
      throw new Error(`No archive.org zip URL found on LibriVox page: ${librivoxPageUrl}`);
    }

    return match[1].replace(/ /g, '%20');
  }
}
