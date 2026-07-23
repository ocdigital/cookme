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
  ],

  // Documentos obsoletos ficam em _archive: fora do build e da busca.
  srcExclude: ['**/_archive/**'],
  
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
            { text: 'Admin — Painel de Produtos', link: '/how-to/admin-painel-produtos' },
            { text: 'Admin — Testes de Integração', link: '/how-to/admin-testes-integracao' },
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
            { text: 'Admin — Arquitetura', link: '/explicacao/admin-arquitetura' },
            { text: 'Notificações — Arquitetura', link: '/explicacao/notificacoes-arquitetura' },
            { text: 'Roadmap Dev IA', link: '/explicacao/roadmap-ia' },
            { text: 'Roadmap IA — Laboratório', link: '/explicacao/roadmap-ia-laboratorio' },
          ]
        }
      ],
      '/adr/': [
        {
          text: '🏛️ Decisões (ADR)',
          items: [
            { text: 'O que são ADRs', link: '/adr/' },
            { text: 'Template', link: '/adr/template' },
            { text: '0001 — pgvector para RAG', link: '/adr/0001-pgvector-para-rag' },
            { text: '0002 — Engine de canonização separada', link: '/adr/0002-engine-canonizacao-servico-separado' },
            { text: '0003 — Proibir scraping autônomo', link: '/adr/0003-proibir-scraping-autonomo' },
            { text: '0004 — Haiku para geração', link: '/adr/0004-haiku-para-geracao-receitas' },
          ]
        }
      ],
      '/negocio/': [
        {
          text: '💼 Negócio & Estratégia',
          items: [
            { text: 'Visão Geral', link: '/negocio/' },
            { text: 'Análise de Mercado', link: '/negocio/ANALISE_MERCADO' },
            { text: 'Análise API Canonização', link: '/negocio/ANALISE_API_CANONIZACAO' },
            { text: 'One-Pager da API', link: '/negocio/ONE_PAGER_API' },
            { text: 'Resumo Executivo', link: '/negocio/EXECUTIVE_SUMMARY' },
            { text: 'Estratégia de Monetização', link: '/negocio/MONETIZATION_STRATEGY' },
            { text: 'Plano Técnico de Monetização', link: '/negocio/MONETIZATION_TECHNICAL_PLAN' },
            { text: 'Guia do Investidor', link: '/negocio/GUIA_INVESTIDOR' },
            { text: 'Estudo de Custo de IA', link: '/negocio/ESTUDO_CUSTO_IA' },
            { text: 'Auditoria', link: '/negocio/AUDITORIA' },
            { text: 'Plano de Correções', link: '/negocio/PLANO_CORRECOES' },
            { text: 'Cronograma de Infraestrutura', link: '/negocio/CRONOGRAMA_INFRA' },
            { text: 'Briefing Landing Page', link: '/negocio/LANDING_PAGE_BRIEFING' },
            { text: 'Briefing de Design', link: '/negocio/DESIGN_BRIEFING' },
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
