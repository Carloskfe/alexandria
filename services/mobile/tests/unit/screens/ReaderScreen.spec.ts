import { ReaderScreen } from '../../../src/screens/reader/ReaderScreen';

describe('ReaderScreen', () => {
  it('exports ReaderScreen as a function', () => {
    expect(typeof ReaderScreen).toBe('function');
  });

  it('returns a React element without throwing', () => {
    const element = ReaderScreen();
    expect(element).toBeTruthy();
  });

  it('renders a root View element', () => {
    const element = ReaderScreen() as any;
    expect(element.type).toBe('View');
  });

  it('renders a Text child with "Reader"', () => {
    const element = ReaderScreen() as any;
    const text = element.props.children;
    expect(text.type).toBe('Text');
    expect(text.props.children).toBe('Reader');
  });
});
