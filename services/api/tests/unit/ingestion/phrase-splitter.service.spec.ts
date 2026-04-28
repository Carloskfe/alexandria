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

  describe('split', () => {
    it('returns an empty array for empty text', () => {
      expect(service.split('')).toEqual([]);
      expect(service.split('   ')).toEqual([]);
    });

    it('assigns sequential indices starting at 0', () => {
      const long = 'A'.repeat(50) + '. ' + 'B'.repeat(50) + '. ' + 'C'.repeat(50) + '.';
      const phrases = service.split(long, 60);

      phrases.forEach((p, i) => expect(p.index).toBe(i));
    });

    it('sets startTime and endTime to 0 for every phrase', () => {
      const text = 'Hello world. This is a test sentence. Another one here.';
      const phrases = service.split(text, 30);

      phrases.forEach((p) => {
        expect(p.startTime).toBe(0);
        expect(p.endTime).toBe(0);
      });
    });

    it('groups short sentences into a single phrase when they fit within maxChars', () => {
      const text = 'Hi. Ok. Yes.';
      const phrases = service.split(text, 200);

      expect(phrases).toHaveLength(1);
      expect(phrases[0].text).toContain('Hi.');
      expect(phrases[0].text).toContain('Ok.');
      expect(phrases[0].text).toContain('Yes.');
    });

    it('splits into multiple phrases when text exceeds maxChars', () => {
      const sentence = 'A'.repeat(100) + '.';
      const text = `${sentence} ${sentence} ${sentence}`;
      const phrases = service.split(text, 110);

      expect(phrases.length).toBeGreaterThan(1);
      phrases.forEach((p) => expect(p.text.length).toBeLessThanOrEqual(110));
    });

    it('handles text with no sentence-ending punctuation as a single phrase', () => {
      const text = 'No punctuation here at all';
      const phrases = service.split(text, 200);

      expect(phrases).toHaveLength(1);
      expect(phrases[0].text).toBe(text);
    });

    it('a single sentence longer than maxChars is emitted as one phrase', () => {
      const text = 'A'.repeat(300) + '.';
      const phrases = service.split(text, 200);

      expect(phrases).toHaveLength(1);
      expect(phrases[0].text.length).toBeGreaterThan(200);
    });
  });
});
