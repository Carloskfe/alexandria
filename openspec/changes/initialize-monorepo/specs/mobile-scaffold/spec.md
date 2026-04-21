## ADDED Requirements

### Requirement: Expo application initializes without errors
The `services/mobile` directory SHALL contain a runnable Expo managed workflow project using TypeScript, with a root screen that renders without errors on both iOS and Android simulators.

#### Scenario: Expo dev server starts
- **WHEN** `npx expo start` is run inside `services/mobile`
- **THEN** the Metro bundler starts and a QR code or simulator launch option is presented

#### Scenario: TypeScript compiles without errors
- **WHEN** `npx tsc --noEmit` is run inside `services/mobile`
- **THEN** the TypeScript compiler exits with code 0

### Requirement: Navigation structure is scaffolded
The `services/mobile/src` directory SHALL contain a bottom tab navigator with four tabs: Library, Reader, Fragments, and Account — each pointing to a placeholder screen component.

#### Scenario: Tab navigation renders
- **WHEN** the app loads on a simulator
- **THEN** a bottom tab bar with four tabs is visible and each tab navigates to its placeholder screen without crashing

### Requirement: Screen directory structure matches planned features
The `services/mobile/src/screens` directory SHALL contain subdirectories for each planned screen area: `library/`, `reader/`, `fragments/`, `account/`, `auth/` — each with a minimal placeholder screen component.

#### Scenario: Screen components import without error
- **WHEN** the app bundle is compiled
- **THEN** all screen imports resolve successfully and no missing module errors appear

### Requirement: Shared API client is wired up
The mobile app SHALL reference a shared API client (base URL configurable via `EXPO_PUBLIC_API_URL`) that can be imported from screens without circular dependency errors.

#### Scenario: API base URL is configurable
- **WHEN** `EXPO_PUBLIC_API_URL` is set in `.env`
- **THEN** the API client uses that URL for all requests without hardcoded fallback values
