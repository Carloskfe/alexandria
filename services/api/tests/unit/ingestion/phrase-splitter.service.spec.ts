import { Test, TestingModule } from '@nestjs/testing';
import { PhraseSplitterService } from '../../../src/ingestion/phrase-splitter.service';

describe('PhraseSplitterService', () => {
  let service: PhraseSplitterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PhraseSplitterService],
    }).compile();

    service = module.get<PhraseSplitterService>(PhraseSplitterService);
  });

  describe('split — basic behaviour', () => {
    it('returns an empty array for empty text', () => {
      expect(service.split('')).toEqual([]);
      expect(service.split('   ')).toEqual([]);
    });

    it('assigns sequential indices starting at 0', () => {
      const text = 'El primer párrafo tiene varias oraciones.\n\nEl segundo también las tiene aquí mismo.';
      const phrases = service.split(text, 60);
      phrases.forEach((p, i) => expect(p.index).toBe(i));
    });

    it('sets startTime and endTime to 0 for every phrase', () => {
      const text = 'Una oración. Otra oración aquí. Y una más.';
      service.split(text).forEach((p) => {
        expect(p.startTime).toBe(0);
        expect(p.endTime).toBe(0);
      });
    });

    it('handles text with no punctuation as a single text phrase', () => {
      const text = 'No punctuation here at all';
      const phrases = service.split(text);
      expect(phrases).toHaveLength(1);
      expect(phrases[0].type).toBe('text');
    });

    it('a single sentence longer than maxChars is emitted as one text phrase', () => {
      const text = 'A'.repeat(300) + '.';
      const phrases = service.split(text, 200);
      expect(phrases).toHaveLength(1);
      expect(phrases[0].type).toBe('text');
      expect(phrases[0].text.length).toBeGreaterThan(200);
    });
  });

  describe('split — paragraph structure', () => {
    it('treats double newlines as paragraph separators', () => {
      const text = 'Párrafo uno con algo de texto completo aquí.\n\nPárrafo dos con más contenido textual aquí.';
      const phrases = service.split(text, 300);
      // Both paragraphs should be present as text phrases
      expect(phrases.some((p) => p.text.includes('Párrafo uno'))).toBe(true);
      expect(phrases.some((p) => p.text.includes('Párrafo dos'))).toBe(true);
      expect(phrases.every((p) => p.type === 'text')).toBe(true);
    });

    it('splits long paragraphs into multiple phrases respecting maxChars', () => {
      const sentence = 'A'.repeat(100) + '.';
      const text = `${sentence} ${sentence} ${sentence}`;
      const phrases = service.split(text, 110);
      expect(phrases.length).toBeGreaterThan(1);
      phrases.forEach((p) => expect(p.text.length).toBeLessThanOrEqual(110));
    });

    it('groups short sentences within a paragraph into one phrase', () => {
      const text = 'Hola. Sí. Gracias.';
      const phrases = service.split(text, 200);
      expect(phrases).toHaveLength(1);
      expect(phrases[0].type).toBe('text');
    });
  });

  describe('split — heading detection', () => {
    it('detects CAPÍTULO keyword as a heading', () => {
      const text = 'CAPÍTULO I\n\nComienzo del texto del capítulo aquí mismo en este ejemplo.';
      const phrases = service.split(text);
      expect(phrases[0].type).toBe('heading');
      expect(phrases[0].text).toBe('CAPÍTULO I');
    });

    it('detects CHAPTER keyword as a heading', () => {
      const text = 'CHAPTER ONE\n\nThe story begins here with this sentence.';
      const phrases = service.split(text);
      expect(phrases[0].type).toBe('heading');
      expect(phrases[0].text).toBe('CHAPTER ONE');
    });

    it('detects TRACTADO keyword as a heading (Lazarillo pattern)', () => {
      const text = 'TRACTADO PRIMERO\n\nEl lazarillo cuenta su origen.';
      const phrases = service.split(text);
      expect(phrases[0].type).toBe('heading');
    });

    it('detects ACTO keyword as a heading (theatre pattern)', () => {
      const text = 'ACTO PRIMERO\n\nLa escena transcurre en Verona.';
      const phrases = service.split(text);
      expect(phrases[0].type).toBe('heading');
    });

    it('detects all-caps lines as headings', () => {
      const text = 'EL LAZARILLO DE TORMES\n\nComienzo de la obra aquí con texto.';
      const phrases = service.split(text);
      expect(phrases[0].type).toBe('heading');
    });

    it('does NOT detect long all-caps text as a heading', () => {
      // A long all-caps block is prose, not a heading
      const longCaps = 'A'.repeat(101);
      const text = `${longCaps}\n\nOtra cosa aquí.`;
      const phrases = service.split(text);
      expect(phrases[0].type).toBe('text');
    });

    it('detects the ##HEADING## marker from Wikisource fetcher', () => {
      const text = '##HEADING## Capítulo I — El principio\n\nTexto del capítulo comienza aquí.';
      const phrases = service.split(text);
      expect(phrases[0].type).toBe('heading');
      expect(phrases[0].text).toBe('Capítulo I — El principio');
    });

    it('strips the ##HEADING## prefix from the stored text', () => {
      const text = '##HEADING## Mi Título\n\nContenido.';
      const phrases = service.split(text);
      expect(phrases[0].text).toBe('Mi Título');
      expect(phrases[0].text).not.toContain('##HEADING##');
    });

    it('body text following a heading gets type text', () => {
      const text = 'CAPÍTULO II\n\nTexto del capítulo dos aquí bien largo.';
      const phrases = service.split(text);
      expect(phrases[0].type).toBe('heading');
      expect(phrases[1].type).toBe('text');
    });
  });

  describe('split — Gutenberg format marker stripping', () => {
    it('strips #bold# markers from body text', () => {
      const text = 'El #héroe# cruzó el río.\n\n';
      const phrases = service.split(text);
      expect(phrases[0].text).toContain('héroe');
      expect(phrases[0].text).not.toContain('#');
    });

    it('strips _italic_ markers from body text', () => {
      const text = 'Dijo _muy claramente_ que no.\n\n';
      const phrases = service.split(text);
      expect(phrases[0].text).not.toContain('_');
    });

    it('strips =bold= markers from body text', () => {
      const text = 'Era =importante= hacerlo bien.\n\n';
      const phrases = service.split(text);
      expect(phrases[0].text).not.toContain('=');
    });

    it('does NOT strip the ##HEADING## double-hash marker', () => {
      const text = '##HEADING## Mi Título\n\nContenido de texto aquí.';
      const phrases = service.split(text);
      expect(phrases[0].type).toBe('heading');
      expect(phrases[0].text).toBe('Mi Título');
    });
  });

  describe('split — noise filtering', () => {
    it('skips Wikisource navigation blocks containing ← Portada', () => {
      const text = '← Portada Viaje al centro de la Tierra Capítulo 2 →\n\nTexto real del capítulo comienza aquí ahora.';
      const phrases = service.split(text);
      expect(phrases.every((p) => !p.text.includes('← Portada'))).toBe(true);
      expect(phrases.some((p) => p.text.includes('Texto real'))).toBe(true);
    });

    it('skips Wikisource artículo enciclopédico navigation blocks', () => {
      const text = 'a. o menos artículo enciclopédico citas otras versiones metadatos\n\nTexto real aquí comienza de verdad.';
      const phrases = service.split(text);
      expect(phrases.every((p) => !p.text.includes('enciclopédico'))).toBe(true);
    });

    it('skips Gutenberg "Produced by" editor notes', () => {
      const text = 'Produced by Stan Goodman and the Online Distributed Proofreading Team\n\nCAPÍTULO I\n\nEl texto comienza aquí de verdad.';
      const phrases = service.split(text);
      expect(phrases.every((p) => !p.text.includes('Produced by'))).toBe(true);
      expect(phrases[0].type).toBe('heading');
    });

    it('skips Gutenberg Transcriber\'s Notes blocks', () => {
      const text = "Transcriber's Notes: Format Conventions\n\nItalic text is _underscores_\n\nTexto de la obra comienza aquí.";
      const phrases = service.split(text);
      expect(phrases.every((p) => !p.text.includes("Transcriber"))).toBe(true);
    });

    it('skips #INDICE# table of contents blocks', () => {
      const text = '#INDICE#\n\nUna estación de amor\nLos ojos sombríos\n\nTexto del primer cuento comienza aquí.';
      const phrases = service.split(text);
      expect(phrases.every((p) => !p.text.includes('INDICE'))).toBe(true);
    });
  });
});
