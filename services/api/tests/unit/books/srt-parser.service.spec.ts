import { Test, TestingModule } from '@nestjs/testing';
import { SrtParserService } from '../../../src/books/srt-parser.service';

const SRT = `1
00:00:01,000 --> 00:00:03,500
Primera frase del libro.

2
00:00:03,700 --> 00:00:06,200
Segunda frase del libro.

3
00:00:06,400 --> 00:00:09,000
Tercera frase del libro.
`;

const VTT = `WEBVTT

00:00:01.000 --> 00:00:03.500
Primera frase del libro.

00:00:03.700 --> 00:00:06.200
Segunda frase del libro.
`;

describe('SrtParserService', () => {
  let service: SrtParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SrtParserService],
    }).compile();
    service = module.get(SrtParserService);
  });

  // ── Format detection ──────────────────────────────────────────────────────

  it('detects srt for a plain SRT block', () => {
    expect(service.parse(SRT).source).toBe('srt');
  });

  it('detects vtt for a WEBVTT block', () => {
    expect(service.parse(VTT).source).toBe('vtt');
  });

  // ── SRT basic behaviour ───────────────────────────────────────────────────

  it('parses three cues into three SyncPhrases', () => {
    expect(service.parse(SRT).phrases).toHaveLength(3);
  });

  it('assigns sequential indices starting at 0', () => {
    const { phrases } = service.parse(SRT);
    expect(phrases.map((p) => p.index)).toEqual([0, 1, 2]);
  });

  it('captures correct text for each cue', () => {
    const { phrases } = service.parse(SRT);
    expect(phrases[0].text).toBe('Primera frase del libro.');
    expect(phrases[1].text).toBe('Segunda frase del libro.');
  });

  it('returns empty array for empty string', () => {
    expect(service.parse('').phrases).toHaveLength(0);
  });

  it('returns empty array for whitespace-only input', () => {
    expect(service.parse('   \n\n   ').phrases).toHaveLength(0);
  });

  it('joins multi-line cues with a space', () => {
    const raw = `1\n00:00:01,000 --> 00:00:03,000\nLínea uno\nLínea dos\n`;
    const { phrases } = service.parse(raw);
    expect(phrases[0].text).toBe('Línea uno Línea dos');
  });

  it('skips cues whose text is empty after normalization', () => {
    const raw = `1\n00:00:01,000 --> 00:00:02,000\n   \n\n2\n00:00:02,500 --> 00:00:04,000\nTexto real.\n`;
    const { phrases } = service.parse(raw);
    expect(phrases).toHaveLength(1);
    expect(phrases[0].text).toBe('Texto real.');
  });

  // ── Timestamp parsing ─────────────────────────────────────────────────────

  it('converts 00:00:01,000 --> 00:00:03,500 to startTime=1.0, endTime=3.5', () => {
    const { phrases } = service.parse(SRT);
    expect(phrases[0].startTime).toBeCloseTo(1.0);
    expect(phrases[0].endTime).toBeCloseTo(3.5);
  });

  it('handles hours > 0 (01:02:03,400 → 3723.4 seconds)', () => {
    const raw = `1\n01:02:03,400 --> 01:02:05,000\nTexto con hora.\n`;
    const { phrases } = service.parse(raw);
    expect(phrases[0].startTime).toBeCloseTo(3723.4);
  });

  it('handles three-digit milliseconds correctly', () => {
    const raw = `1\n00:00:01,123 --> 00:00:02,456\nMilisegundos.\n`;
    const { phrases } = service.parse(raw);
    expect(phrases[0].startTime).toBeCloseTo(1.123);
    expect(phrases[0].endTime).toBeCloseTo(2.456);
  });

  // ── VTT behaviour ─────────────────────────────────────────────────────────

  it('skips the WEBVTT header block', () => {
    const { phrases } = service.parse(VTT);
    expect(phrases[0].text).toBe('Primera frase del libro.');
  });

  it('returns correct phrase count from VTT', () => {
    expect(service.parse(VTT).phrases).toHaveLength(2);
  });

  it('skips NOTE blocks in VTT', () => {
    const raw = `WEBVTT\n\nNOTE This is a comment\n\n00:00:01.000 --> 00:00:02.000\nTexto real.\n`;
    const { phrases } = service.parse(raw);
    expect(phrases).toHaveLength(1);
    expect(phrases[0].text).toBe('Texto real.');
  });

  it('accepts cues with cue identifiers before the timing line', () => {
    const raw = `WEBVTT\n\nmi-cue-id\n00:00:01.000 --> 00:00:02.000\nTexto con id.\n`;
    const { phrases } = service.parse(raw);
    expect(phrases).toHaveLength(1);
    expect(phrases[0].text).toBe('Texto con id.');
  });

  it('uses dot separator correctly for VTT timestamps', () => {
    const { phrases } = service.parse(VTT);
    expect(phrases[0].startTime).toBeCloseTo(1.0);
    expect(phrases[0].endTime).toBeCloseTo(3.5);
  });

  it('strips HTML tags from VTT cue text', () => {
    const raw = `WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n<v Speaker>Texto con etiqueta.</v>\n`;
    const { phrases } = service.parse(raw);
    expect(phrases[0].text).toBe('Texto con etiqueta.');
  });

  // ── Shared guarantees ─────────────────────────────────────────────────────

  it('all output phrases have type "text"', () => {
    const { phrases } = service.parse(SRT);
    phrases.forEach((p) => expect(p.type).toBe('text'));
  });

  it('all output phrases have startTime and endTime as positive numbers', () => {
    const { phrases } = service.parse(SRT);
    phrases.forEach((p) => {
      expect(typeof p.startTime).toBe('number');
      expect(typeof p.endTime).toBe('number');
      expect(p.startTime).toBeGreaterThanOrEqual(0);
      expect(p.endTime).toBeGreaterThan(0);
    });
  });

  it('works with Windows-style CRLF line endings', () => {
    const raw = SRT.replace(/\n/g, '\r\n');
    expect(service.parse(raw).phrases).toHaveLength(3);
  });
});
