# Orbis Mobile
The mobile app of Orbis, built with [Expo](https://expo.dev) and Expo Router.

## Instructions
1. From the [Orbis repository](https://github.com/PolsarCode/orbis), run `pnpm run setup`.
2. Run `pnpm run develop:mobile` there. It starts the server and Expo together.
3. Scan the QR code with Expo Go (same Wi-Fi as your computer), or press `i` / `a` for the iOS simulator or Android emulator.

The app finds the server on the computer running Expo automatically. To use another server, set `EXPO_PUBLIC_API_URL` in `.env.local` (copied from `example.env`). Set `EXPO_PUBLIC_WEB_URL` to the website's base URL when using a staging site; the default points to `https://orbis.polsar.studio` for the Terms and Community guidelines links.

## Deploying
`pnpm run deploy` publishes an over-the-air update with EAS Update. Before the first deploy, run once in this folder:

```bash
pnpm exec eas login
pnpm exec eas init
pnpm exec eas update:configure
```
