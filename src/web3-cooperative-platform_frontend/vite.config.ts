import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type PluginOption } from 'vite';

export default defineConfig({
  plugins: [sveltekit() as PluginOption, tailwindcss() as PluginOption]
});
