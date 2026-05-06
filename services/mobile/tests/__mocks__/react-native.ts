const View = 'View';
const Text = 'Text';
const ScrollView = 'ScrollView';
const TouchableOpacity = 'TouchableOpacity';
const StyleSheet = { create: (s: Record<string, unknown>) => s };
const Alert = { alert: jest.fn() };
const Linking = { openURL: jest.fn() };
const Platform = { OS: 'ios' };
const BackHandler = { exitApp: jest.fn() };

export {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  BackHandler,
};
