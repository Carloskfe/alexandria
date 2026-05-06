import { Alert, Linking, Platform, BackHandler } from 'react-native';
import { CONSENT_VERSION, saveConsent } from '../../../src/offline/consent-storage';

jest.mock('../../../src/offline/consent-storage', () => ({
  CONSENT_VERSION: '1.0',
  saveConsent: jest.fn().mockResolvedValue(undefined),
}));

const mockSetLoading = jest.fn();
let currentLoading = false;

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn((initial: unknown) => [currentLoading ?? initial, mockSetLoading]),
}));

// Import after mocks are in place
import { ConsentScreen } from '../../../src/screens/ConsentScreen';

const mockAlert = Alert.alert as jest.Mock;
const mockLinking = Linking.openURL as jest.Mock;
const mockSaveConsent = saveConsent as jest.Mock;

describe('ConsentScreen', () => {
  const onConsent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    currentLoading = false;
  });

  it('exports ConsentScreen as a function', () => {
    expect(typeof ConsentScreen).toBe('function');
  });

  it('returns a React element without throwing', () => {
    const element = ConsentScreen({ onConsent });
    expect(element).toBeTruthy();
  });

  it('renders a root View element', () => {
    const element = ConsentScreen({ onConsent }) as any;
    expect(element.type).toBe('View');
  });

  describe('handleAccept', () => {
    it('calls saveConsent with the current CONSENT_VERSION and accepted:true', async () => {
      // Capture the handleAccept closure by inspecting bottom bar children
      const element = ConsentScreen({ onConsent }) as any;
      const bottomBar = element.props.children[1]; // second child is the sticky bottom bar
      const acceptBtn = bottomBar.props.children[0];
      const handleAccept = acceptBtn.props.onPress;

      await handleAccept();

      expect(mockSaveConsent).toHaveBeenCalledWith({
        version: CONSENT_VERSION,
        accepted: true,
        timestamp: expect.any(Number),
      });
    });

    it('calls onConsent callback after saving', async () => {
      const element = ConsentScreen({ onConsent }) as any;
      const bottomBar = element.props.children[1];
      const acceptBtn = bottomBar.props.children[0];

      await acceptBtn.props.onPress();

      expect(onConsent).toHaveBeenCalledTimes(1);
    });

    it('sets loading to true then false around the save', async () => {
      const element = ConsentScreen({ onConsent }) as any;
      const bottomBar = element.props.children[1];
      const acceptBtn = bottomBar.props.children[0];

      await acceptBtn.props.onPress();

      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('disables the accept button while loading', () => {
      currentLoading = true;
      const element = ConsentScreen({ onConsent }) as any;
      const bottomBar = element.props.children[1];
      const acceptBtn = bottomBar.props.children[0];
      expect(acceptBtn.props.disabled).toBe(true);
    });

    it('enables the accept button when not loading', () => {
      currentLoading = false;
      const element = ConsentScreen({ onConsent }) as any;
      const bottomBar = element.props.children[1];
      const acceptBtn = bottomBar.props.children[0];
      expect(acceptBtn.props.disabled).toBe(false);
    });
  });

  describe('handleDecline', () => {
    it('shows an Alert when the decline button is pressed', () => {
      const element = ConsentScreen({ onConsent }) as any;
      const bottomBar = element.props.children[1];
      const declineBtn = bottomBar.props.children[1];

      declineBtn.props.onPress();

      expect(mockAlert).toHaveBeenCalledTimes(1);
    });

    it('does not call onConsent when declining', () => {
      const element = ConsentScreen({ onConsent }) as any;
      const bottomBar = element.props.children[1];
      const declineBtn = bottomBar.props.children[1];

      declineBtn.props.onPress();

      expect(onConsent).not.toHaveBeenCalled();
    });

    it('calls BackHandler.exitApp on Android when OK is pressed in the alert', () => {
      (Platform as any).OS = 'android';
      const element = ConsentScreen({ onConsent }) as any;
      const bottomBar = element.props.children[1];
      const declineBtn = bottomBar.props.children[1];

      declineBtn.props.onPress();

      const alertButtons = mockAlert.mock.calls[0][2] as Array<{ text: string; onPress: () => void }>;
      const okButton = alertButtons.find((b) => b.text === 'OK');
      okButton?.onPress();

      expect(BackHandler.exitApp).toHaveBeenCalledTimes(1);
      (Platform as any).OS = 'ios';
    });

    it('does not call BackHandler.exitApp on iOS when OK is pressed', () => {
      (Platform as any).OS = 'ios';
      const element = ConsentScreen({ onConsent }) as any;
      const bottomBar = element.props.children[1];
      const declineBtn = bottomBar.props.children[1];

      declineBtn.props.onPress();

      const alertButtons = mockAlert.mock.calls[0][2] as Array<{ text: string; onPress: () => void }>;
      const okButton = alertButtons.find((b) => b.text === 'OK');
      okButton?.onPress();

      expect(BackHandler.exitApp).not.toHaveBeenCalled();
    });
  });

  describe('legal links', () => {
    it('renders Linking.openURL calls for privacy and terms links', () => {
      const element = ConsentScreen({ onConsent }) as any;
      const scrollView = element.props.children[0];
      const scrollContent = scrollView.props.children;

      // Collect all TouchableOpacity onPress handlers in the scroll
      function collectLinks(node: any): Array<() => void> {
        if (!node || typeof node !== 'object') return [];
        const results: Array<() => void> = [];
        if (node.type === 'TouchableOpacity' && node.props?.onPress) {
          results.push(node.props.onPress);
        }
        const children = node.props?.children;
        if (Array.isArray(children)) {
          children.forEach((c: any) => results.push(...collectLinks(c)));
        } else if (children) {
          results.push(...collectLinks(children));
        }
        return results;
      }

      const linkHandlers = collectLinks({ type: 'ScrollView', props: { children: scrollContent } });
      expect(linkHandlers.length).toBeGreaterThan(0);

      linkHandlers[0]();
      expect(mockLinking).toHaveBeenCalled();
    });
  });
});
