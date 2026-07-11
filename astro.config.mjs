import { defineConfig } from 'astro/config'

export default defineConfig({
  output: 'static',
  build: {
    // Serve fewer requests from the Worker: embed all CSS into the HTML.
    inlineStylesheets: 'always',
  },
})
