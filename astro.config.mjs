import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://barberenamimunicipio.top',
  integrations: [sitemap()],
  build: {
    format: 'directory'
  }
});
