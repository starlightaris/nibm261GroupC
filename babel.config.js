module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@navigation': './src/navigation',
            '@pages':      './src/pages',
            '@components': './src/components',
            '@services':   './src/services',
            '@hooks':      './src/hooks',
            '@store':      './src/store',
            '@types':      './src/types',
            '@constants':  './src/constants',
            '@config':     './',
          },
        },
      ],
    ],
  };
};