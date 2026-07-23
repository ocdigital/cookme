import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'CookMe Documentation',
  description: 'Complete documentation for the CookMe project - a recipe and ingredients management platform',
  lang: 'pt-BR',
  
  // Theme configuration
  appearance: 'dark',

  // Validação de links no build (nosso link-checker). localhost são exemplos de
  // dev, não navegação. /adr/ e /negocio/ chegam nas fases 3 e 5 da reorganização.
  ignoreDeadLinks: [
    /^https?:\/\/localhost/,
    /^\/adr\//,
    /^\/negocio\//,
  ],
  
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

    // Navegação organizada por tipo Diátaxis (tutoriais/how-to/referência/explicação)
    nav: [
      { text: 'Home', link: '/' },
      { text: '📖 Tutoriais', link: '/tutoriais/' },
      { text: '🔧 How-to', link: '/how-to/' },
      { text: '📚 Referência', link: '/referencia/' },
      { text: '💡 Explicação', link: '/explicacao/' },
      {
        text: 'Mais',
        items: [
          { text: '🧠 Inteligência', link: '/explicacao/inteligencia' },
          { text: '🏛️ Decisões (ADR)', link: '/adr/' },
          { text: '💼 Negócio', link: '/negocio/' },
        ]
      },
    ],

    // Sidebar por seção Diátaxis
    sidebar: {
      '/tutoriais/': [
        {
          text: '📖 Tutoriais',
          items: [
            { text: 'Guia de Aprendizado', link: '/tutoriais/guia-aprendizado' },
          ]
        }
      ],
      '/how-to/': [
        {
          text: '🔧 How-to (Tarefas)',
          items: [
            { text: 'Setup Rápido', link: '/how-to/setup-rapido' },
            { text: 'Docker Compose', link: '/how-to/docker-compose' },
            { text: 'Criar Usuário de Teste', link: '/how-to/criar-usuario' },
            { text: 'Rodar Testes', link: '/how-to/testes' },
            { text: 'Deploy no VPS', link: '/how-to/deploy-vps' },
          ]
        }
      ],
      '/referencia/': [
        {
          text: '📚 Referência',
          items: [
            {
              text: 'Backend (NestJS)',
              items: [
                { text: 'Visão Geral & Módulos', link: '/referencia/backend/' },
                { text: 'Todos os Endpoints', link: '/referencia/backend/api' },
                { text: 'Entidades TypeORM', link: '/referencia/backend/entidades' },
                { text: 'Endpoints (guia)', link: '/referencia/endpoints' },
              ]
            },
            {
              text: 'Mobile (Expo)',
              items: [
                { text: 'Telas & Navegação', link: '/referencia/mobile/' },
                { text: 'Hooks & Services', link: '/referencia/mobile/servicos' },
              ]
            },
            {
              text: 'Admin Frontend (React)',
              items: [
                { text: 'Páginas & Componentes', link: '/referencia/frontend/' },
              ]
            },
          ]
        }
      ],
      '/explicacao/': [
        {
          text: '💡 Explicação',
          items: [
            { text: 'Arquitetura — Visão Geral', link: '/explicacao/arquitetura/visao-geral' },
            { text: 'Arquitetura — Diagrama Visual', link: '/explicacao/arquitetura/diagrama-visual' },
            { text: 'Inteligência (IA / RAG)', link: '/explicacao/inteligencia' },
            { text: 'AWS e Escalabilidade', link: '/explicacao/aws-escalabilidade' },
            { text: 'Plano Offline First', link: '/explicacao/offline-plan' },
            { text: 'Roadmap Dev IA', link: '/explicacao/roadmap-ia' },
          ]
        }
      ],
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
