// Extends app.json. Secrets are injected from the environment (.env locally, EAS secrets in cloud builds).
module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    console.warn(
      "[app.config] GOOGLE_MAPS_API_KEY is not set - maps will not render in native builds."
    );
  }

  return {
    ...config,
    // ios/android `config` blocks are stripped from the manifest the app receives,
    // so expose the key to JS (directions requests) via `extra`.
    extra: {
      ...config.extra,
      googleMapsApiKey,
    },
    ios: {
      ...config.ios,
      config: {
        ...config.ios?.config,
        googleMapsApiKey,
      },
    },
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: { apiKey: googleMapsApiKey },
      },
    },
  };
};
