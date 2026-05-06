import { AccountScreen } from '../../../src/screens/account/AccountScreen';

describe('AccountScreen', () => {
  it('exports AccountScreen as a function', () => {
    expect(typeof AccountScreen).toBe('function');
  });

  it('returns a React element without throwing', () => {
    const element = AccountScreen();
    expect(element).toBeTruthy();
  });

  it('renders a root View element', () => {
    const element = AccountScreen() as any;
    expect(element.type).toBe('View');
  });

  it('renders a Text child with "Account"', () => {
    const element = AccountScreen() as any;
    const text = element.props.children;
    expect(text.type).toBe('Text');
    expect(text.props.children).toBe('Account');
  });
});
