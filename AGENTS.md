This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Orbis Conventions

- This repository is the `mobile` submodule of [PolsarCode/orbis](https://github.com/PolsarCode/orbis). Run it from there with `pnpm run develop:mobile`, which also starts the server.
- Components follow atomic design in `src/components/{atoms,molecules,organisms,templates}`. Each folder has an `index.ts` that re-exports every component; add a line there for each new component. Import them as namespaces: `import * as Atom from '@atom';` and use `<Atom.Button />` (likewise `@molecule`, `@organism`, `@template`).
- Screens in `src/app/` compose templates and organisms and hold no reusable UI of their own.
- State lives in Zustand stores in `src/stores/`. The auth token is persisted with `expo-secure-store` (`src/lib/storage.ts`, `localStorage` on web); never store it in plain storage on native.
- Server requests go through `src/lib/api.ts`. `API_URL` is `EXPO_PUBLIC_API_URL`, or the Expo dev host on port `4000` when it is empty. Keep request shapes and error messages in step with `web/src/lib/api.ts`.
- Style with `StyleSheet` and the tokens in `src/constants/theme.ts` (`useTheme`, `Spacing`) so light and dark mode keep working.
- Machine-specific values go in `.env.local` (gitignored); `example.env` lists every variable.
