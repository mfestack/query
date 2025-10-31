import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'MFestack Query',
  description: 'A next-generation data-fetching and caching library for React, Vue, Angular, and more',
  base: '/',
  ignoreDeadLinks: true, // Ignore dead links during development
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Recipes', link: '/recipes/' },
      { text: 'Migration', link: '/migration/' },
      { text: 'GitHub', link: 'https://github.com/mfestack/query' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Quick Start', link: '/guide/quickstart' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Basic Usage', link: '/guide/basic-usage' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Queries', link: '/guide/queries' },
            { text: 'Mutations', link: '/guide/mutations' },
            { text: 'Query Client', link: '/guide/query-client' },
            { text: 'Scopes & Isolation', link: '/guide/scopes' }
          ]
        },
        {
          text: 'Features',
          items: [
            { text: 'SSR & Hydration', link: '/guide/ssr' },
            { text: 'Plugins', link: '/guide/plugins' },
            { text: 'DevTools', link: '/guide/devtools' },
            { text: 'Performance', link: '/guide/performance' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'Core API',
          items: [
            { text: 'QueryClient', link: '/api/query-client' },
            { text: 'ClientRegistry', link: '/api/client-registry' },
            { text: 'Hydration', link: '/api/hydration' }
          ]
        },
        {
          text: 'React API',
          items: [
            { text: 'useQuery', link: '/api/use-query' },
            { text: 'useMutation', link: '/api/use-mutation' },
            { text: 'useInfiniteQuery', link: '/api/use-infinite-query' }
          ]
        }
      ],
      '/recipes/': [
        { text: 'Pagination', link: '/recipes/pagination' },
        { text: 'Optimistic Updates', link: '/recipes/optimistic-updates' },
        { text: 'Dependent Queries', link: '/recipes/dependent-queries' },
        { text: 'SSR Setup', link: '/recipes/ssr-setup' },
        { text: 'Scoped Clients', link: '/recipes/scoped-clients' }
      ],
      '/migration/': [
        { text: 'Overview', link: '/migration/' }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/mfestack/query' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 MFestack'
    }
  }
})

