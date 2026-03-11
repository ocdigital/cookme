# CookMe Documentation

Documentação oficial do projeto CookMe - Plataforma de Receitas e Gerenciamento de Ingredientes.

## Quick Start

```bash
# Instalar dependências (feito no root)
npm install -D vitepress vue

# Iniciar servidor de desenvolvimento
npm run docs:dev

# Build para produção
npm run docs:build

# Preview do build
npm run docs:preview
```

A documentação estará disponível em `http://localhost:5173`

## Estrutura

- **aprendizado/**: Guias de aprendizado e conceitos fundamentais
- **arquitetura/**: Documentação da arquitetura do sistema
- **setup/**: Instruções de configuração e setup
- **guides/**: Guias avançados (AWS, testes, APIs, etc.)

## Contribuindo

Para adicionar novas páginas:

1. Crie um arquivo `.md` na pasta apropriada
2. Atualize a configuração em `.vitepress/config.ts`
3. Teste localmente com `npm run docs:dev`
4. Commit e push

## Estrutura de Arquivos

```
docs/
├── .vitepress/          # Configuração do VitePress
│   ├── config.ts        # Configuração principal
│   └── theme/           # Tema customizado
├── index.md             # Página inicial
├── aprendizado/         # Seção de aprendizado
├── arquitetura/         # Documentação de arquitetura
├── setup/               # Guias de setup
└── guides/              # Guias avançados
```

## Configuração

### Adicionar Nova Seção

1. Crie uma nova pasta em `docs/`
2. Crie `index.md` nela
3. Adicione à navegação em `config.ts`

### Customizar Estilos

Edite `docs/.vitepress/theme/custom.css` para modificar cores e estilos.

### Adicionar Links Sociais

Em `docs/.vitepress/config.ts`, modifique `socialLinks`:

```typescript
socialLinks: [
  { icon: 'github', link: 'https://github.com/seu-usuario/cookme' },
  { icon: 'twitter', link: 'https://twitter.com/seu-usuario' }
]
```

## Tecnologias

- **VitePress**: Site estático gerado por Vite
- **Vue 3**: Para componentes interativos
- **Markdown**: Linguagem de markup para conteúdo

## Links Úteis

- [VitePress Docs](https://vitepress.dev/)
- [Markdown Guide](https://www.markdownguide.org/)
- [Projeto CookMe](https://github.com/seu-usuario/cookme)

---

**Versão**: 1.0.0  
**Última atualização**: 2024
