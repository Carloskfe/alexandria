import { LoginScreen } from '../../../src/screens/auth/LoginScreen';

describe('LoginScreen', () => {
  it('exports LoginScreen as a function', () => {
    expect(typeof LoginScreen).toBe('function');
  });

  it('returns a React element without throwing', () => {
    const element = LoginScreen();
    expect(element).toBeTruthy();
  });

  it('renders a root View element', () => {
    const element = LoginScreen() as any;
    expect(element.type).toBe('View');
  });

  it('renders a Text child with "Login"', () => {
    const element = LoginScreen() as any;
    const text = element.props.children;
    expect(text.type).toBe('Text');
    expect(text.props.children).toBe('Login');
  });
});
