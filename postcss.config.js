import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    autoprefixer({
      overrideBrowserslist: ['defaults', 'not IE 11', 'safari >= 9'],
    }),
  ],
};
  