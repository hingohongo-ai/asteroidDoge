import { defineConfig } from 'vite';

// base './' keeps asset URLs relative, so the build works from any folder or domain
// (the temp Plesk domain now, the real domain later).
export default defineConfig({
  base: './',
});
