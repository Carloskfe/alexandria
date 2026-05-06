import { LibraryScreen } from '../../../src/screens/library/LibraryScreen';

describe('LibraryScreen', () => {
  it('exports LibraryScreen as a function', () => {
    expect(typeof LibraryScreen).toBe('function');
  });

  it('returns a React element without throwing', () => {
    const element = LibraryScreen();
    expect(element).toBeTruthy();
  });

  it('renders a root View element', () => {
    const element = LibraryScreen() as any;
    expect(element.type).toBe('View');
  });

  it('renders a Text child with "Library"', () => {
    const element = LibraryScreen() as any;
    const text = element.props.children;
    expect(text.type).toBe('Text');
    expect(text.props.children).toBe('Library');
  });
});
