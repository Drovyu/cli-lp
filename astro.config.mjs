import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://cli.drovyu.com',
  output: 'static',
  build: {
    // Serve fewer requests from the Worker: embed all CSS into the HTML.
    inlineStylesheets: 'always',
  },
})
