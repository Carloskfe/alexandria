import { Injectable } from '@nestjs/common';
import { SyncPhrase } from '../books/sync-map.entity';

@Injectable()
export class PhraseSplitterService {
  split(text: string, maxChars = 200): SyncPhrase[] {
    const trimmed = text.trim();
    if (!trimmed) return [];

    const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [trimmed];

    const phrases: SyncPhrase[] = [];
    let current = '';
    let index = 0;

    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s) continue;

      if (current.length > 0 && current.length + 1 + s.length > maxChars) {
        phrases.push({ index: index++, text: current, startTime: 0, endTime: 0 });
        current = s;
      } else {
        current = current ? `${current} ${s}` : s;
      }
    }

    if (current) {
      phrases.push({ index: index, text: current, startTime: 0, endTime: 0 });
    }

    return phrases;
  }
}
