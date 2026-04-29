import { Injectable } from '@nestjs/common';
import { SyncPhrase } from '../books/sync-map.entity';

const HEADING_MARKER = '##HEADING##';

@Injectable()
export class PhraseSplitterService {
  split(text: string, maxChars = 200): SyncPhrase[] {
    // Normalize Windows line endings and Gutenberg format markers
    const normalized = text
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Strip Gutenberg format markers — use lookbehind/ahead to avoid matching ##HEADING##
      .replace(/(?<![#])#([^#\n]{1,80})#(?![#])/g, '$1')  // #bold# → bold
      .replace(/=([^=\n]{1,80})=/g, '$1')                   // =bold= → bold
      .replace(/_([^_\n]{1,80})_/g, '$1');                  // _italic_ → italic

    if (!normalized) return [];

    const blocks = normalized.split(/\n{2,}/);
    const phrases: SyncPhrase[] = [];
    let index = 0;

    for (const block of blocks) {
      const b = block.trim();
      if (!b) continue;

      // Skip Wikisource navigation template noise
      if (this.isNavigationNoise(b)) continue;

      // Skip Gutenberg production/editor metadata blocks
      if (this.isProductionNote(b)) continue;

      if (b.startsWith(HEADING_MARKER)) {
        // Marker may be followed by a space or newline before the heading text
        const headingText = b.slice(HEADING_MARKER.length).replace(/^[\s]+/, '').trim();
        if (headingText) {
          phrases.push({ index: index++, text: headingText, type: 'heading', startTime: 0, endTime: 0 });
        }
      } else if (this.isHeading(b)) {
        phrases.push({ index: index++, text: b, type: 'heading', startTime: 0, endTime: 0 });
      } else {
        for (const s of this.splitParagraph(b, maxChars)) {
          phrases.push({ index: index++, text: s, type: 'text', startTime: 0, endTime: 0 });
        }
      }
    }

    return phrases;
  }

  private isNavigationNoise(text: string): boolean {
    if (/←\s*(Portada|Anterior|Siguiente)/.test(text)) return true;
    if (/artículo enciclopédico/i.test(text)) return true;
    if (/\bmetadatos\b/i.test(text) && text.length < 300) return true;
    if (/otras versiones/i.test(text) && text.length < 300) return true;
    return false;
  }

  private isProductionNote(text: string): boolean {
    // English Gutenberg editor/production patterns
    if (/^Produced by\b/i.test(text)) return true;
    if (/^Transcriber.s Notes?/i.test(text)) return true;
    if (/^Transcribed by\b/i.test(text)) return true;
    if (/^Copyright\s*\(C\)/i.test(text)) return true;
    if (/^Online Distributed Proofreading/i.test(text)) return true;
    if (/^With an Introduction/i.test(text)) return true;
    if (/^Introduction and Notes/i.test(text)) return true;
    if (/^Vocabulary by\b/i.test(text)) return true;
    if (/^Italic text is denoted/i.test(text)) return true;
    if (/^Bold text is denoted/i.test(text)) return true;
    if (/^Format Convention/i.test(text)) return true;
    // Spanish Gutenberg transcriber notes
    if (/^Nota del Transcriptor/i.test(text)) return true;
    if (/^Se ha respetado (la ortografía|el texto)/i.test(text)) return true;
    if (/^Errores obvios de imprenta/i.test(text)) return true;
    if (/^Páginas en blanco han sido/i.test(text)) return true;
    if (/^El texto ha sido digitalizado/i.test(text)) return true;
    // Table of contents markers
    if (/^#?ÍNDICE#?$|^#?INDICE#?$/i.test(text)) return true;
    return false;
  }

  private isHeading(text: string): boolean {
    if (text.length > 100) return false;
    if (
      /^(CHAPTER|CAPÍTULO|CAPITULO|TRACTADO|PARTE|PART|LIBRO|BOOK|ACTO|ACT|CANTO|SECCIÓN|SECTION|PRÓLOGO|PROLOGO|EPILOGO|EPÍLOGO|INTRODUCCIÓN|INTRODUCCION|APÉNDICE|APPENDIX)\b/i.test(
        text,
      )
    )
      return true;
    // All-caps line with no lowercase letters
    if (!/[a-záéíóúü]/.test(text) && /[A-ZÁÉÍÓÚÜÑ]{3}/.test(text)) return true;
    // Standalone Roman numerals
    if (/^[IVXLCDM]+\.?\s*$/.test(text) && text.length <= 8) return true;
    return false;
  }

  private splitParagraph(paragraph: string, maxChars: number): string[] {
    const sentences = paragraph.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [paragraph];
    const results: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s) continue;
      if (current.length > 0 && current.length + 1 + s.length > maxChars) {
        results.push(current);
        current = s;
      } else {
        current = current ? `${current} ${s}` : s;
      }
    }

    if (current) results.push(current);
    return results;
  }
}
