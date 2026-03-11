import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // we can use this slot to inject the archive link into the navbar
    })
  },
  enhanceApp({ app, router, siteData }) {
    // app.use(plugin)
  }
} satisfies Theme
