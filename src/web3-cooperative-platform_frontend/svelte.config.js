import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // Use static adapter for Internet Computer deployment
    adapter: adapter({
      // Output to the dist directory which is what dfx.json expects
      fallback: 'index.html',
      pages: 'dist',
      assets: 'dist'
    })
  }
};

export default config;
