import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://eangulomm.github.io',
  base: '/phonecitybq',
  integrations: [tailwind({ applyBaseStyles: false })],
});
