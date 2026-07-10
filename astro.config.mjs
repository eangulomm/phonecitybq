import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://demo.tutienda.com',
  integrations: [tailwind({ applyBaseStyles: false })],
});
