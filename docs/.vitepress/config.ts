import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'CookMe Documentation',
  description: 'Complete documentation for the CookMe project - a recipe and ingredients management platform',
  lang: 'pt-BR',
  
  // Theme configuration
  appearance: 'dark',
  
  // Head tags
  head: [
    ['meta', { name: 'theme-color', content: '#3c366b' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'pt_BR' }],
  ],

  // Navigation and sidebar
  themeConfig: {
    logo: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg',
      alt: 'CookMe Logo',
    },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Aprendizado', link: '/aprendizado/' },
      { text: 'Arquitetura', link: '/arquitetura/' },
      { text: 'Setup', link: '/setup/' },
      { text: 'Guias', link: '/guides/' },
      {
        text: 'Links',
        items: [
          { text: 'GitHub', link: 'https://github.com' },
          { text: 'Issues', link: 'https://github.com/issues' },
        ]
      }
    ],

    sidebar: {
      '/aprendizado/': [
        {
          text: 'Aprendizado',
          items: [
            { text: 'Guia de Aprendizado', link: '/aprendizado/guia-aprendizado' },
          ]
        }
      ],
      '/arquitetura/': [
        {
          text: 'Arquitetura',
          items: [
            { text: 'Visão Geral', link: '/arquitetura/visao-geral' },
            { text: 'Diagrama Visual', link: '/arquitetura/diagrama-visual' },
          ]
        }
      ],
      '/setup/': [
        {
          text: 'Configuração',
          items: [
            { text: 'Setup Rápido', link: '/setup/setup-rapido' },
            { text: 'Docker Compose', link: '/setup/docker-compose' },
            { text: 'Como Criar Usuário', link: '/setup/criar-usuario' },
          ]
        }
      ],
      '/guides/': [
        {
          text: 'Guias',
          items: [
            { text: 'AWS e Escalabilidade', link: '/guides/aws-escalabilidade' },
            { text: 'Endpoints', link: '/guides/endpoints' },
            { text: 'Testes', link: '/guides/testes' },
          ]
        }
      ]
    },

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/seu-usuario/cookme' },
    ],

    // Search configuration
    search: {
      provider: 'local',
      options: {
        locales: {
          'pt-BR': {
            translations: {
              button: {
                buttonText: 'Pesquisar',
                buttonAriaLabel: 'Pesquisar documentação'
              },
              modal: {
                noResultsText: 'Nenhum resultado encontrado',
                resetButtonTitle: 'Limpar a pesquisa',
                footer: {
                  selectText: 'para selecionar',
                  navigateText: 'para navegar',
                  closeText: 'para fechar'
                }
              }
            }
          }
        }
      }
    },

    // Footer
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 CookMe Project'
    },

    // Edit link
    editLink: {
      pattern: 'https://github.com/seu-usuario/cookme/edit/main/docs/:path',
      text: 'Edit this page'
    },

    // Last updated
    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium',
        localeMatcher: 'best fit'
      }
    }
  },

  // Markdown configuration
  markdown: {
    lineNumbers: true,
    toc: { level: [2, 3] }
  }
})
