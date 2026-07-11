import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://cli.drovyu.com',
  output: 'static',
  integrations: [sitemap()],
  build: {
    // Serve fewer requests from the Worker: embed all CSS into the HTML.
    inlineStylesheets: 'always',
  },
})
