# Automated Expo Go compatibility checks

Run `npm ci`, then `npm run test:expo-go`.

The script checks Expo dependency compatibility, starts a temporary Metro server in Expo Go mode on an available port, requests Android and iOS SDK manifests and development bundles, and stops its own server. It fails when dependencies, manifests or bundles are incompatible or unavailable. It is independent of individual feature screens.

These checks do not simulate phone interaction or access live Firebase. For a device test, start Expo with `npx expo start --go` and open it in Expo Go on a supported device. Android/iOS production exports and `npx expo-doctor@latest` provide additional build/configuration checks.

Provide the project's Firebase configuration and `GOOGLE_MAPS_API_KEY` locally for live authentication, database and map testing. The script does not print full manifests containing application configuration.
