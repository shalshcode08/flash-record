# FlashRecord Mobile Structure

Android is the first implementation target. The React Native app lives under
`mobile/`, with native Android code generated or added under `mobile/android/`
when the app is scaffolded.

## Layout

```text
mobile/
  src/
    app/                 App bootstrap, providers, navigation wiring
    assets/              Static fonts, icons, and images
    components/          Shared reusable UI and app-level components
    features/            Product features grouped by domain
    native/              TypeScript bridge definitions and native events
    screens/             Route-level screens
    services/            Platform services such as permissions and storage
    theme/               Design tokens and themed helpers
    types/               Shared TypeScript types
    utils/               Small platform-neutral utilities
  android/               Android native project/code
  ios/                   Reserved for later iOS support
```

## First Principle

Feature code owns product behavior. Shared code stays small and reusable.
Native bridge definitions are isolated so Android, and later iOS, can expose
the same TypeScript-facing recorder API.
