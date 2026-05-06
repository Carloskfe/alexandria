import { FragmentsScreen } from '../../../src/screens/fragments/FragmentsScreen';

describe('FragmentsScreen', () => {
  it('exports FragmentsScreen as a function', () => {
    expect(typeof FragmentsScreen).toBe('function');
  });

  it('returns a React element without throwing', () => {
    const element = FragmentsScreen();
    expect(element).toBeTruthy();
  });

  it('renders a root View element', () => {
    const element = FragmentsScreen() as any;
    expect(element.type).toBe('View');
  });

  it('renders a Text child with "Fragments"', () => {
    const element = FragmentsScreen() as any;
    const text = element.props.children;
    expect(text.type).toBe('Text');
    expect(text.props.children).toBe('Fragments');
  });
});
