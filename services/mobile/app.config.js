module.exports = {
  expo: {
    name: 'Noetia',
    slug: 'noetia',
    version: '1.0.0',
    runtimeVersion: { policy: 'sdkVersion' },
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0D1B2A',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.noetia.app',
      usesAppleSignIn: true,
      buildNumber: '1',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0D1B2A',
      },
      package: 'com.noetia.app',
      // Resolved at build time from EAS file secret GOOGLE_SERVICES_JSON
      ...(process.env.GOOGLE_SERVICES_JSON
        ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON }
        : {}),
      versionCode: 1,
    },
    scheme: 'noetia',
    plugins: ['expo-apple-authentication'],
    extra: {
      eas: { projectId: '99e71dcb-bfa3-4c8d-bb74-2d20edbb1826' },
    },
    owner: 'carloskfe',
  },
};
