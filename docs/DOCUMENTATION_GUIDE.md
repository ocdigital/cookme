# Guia da Documentação VitePress

Este documento explica como usar e expandir a documentação do CookMe usando VitePress.

## Estrutura de Pastas

```
docs/
├── .vitepress/
│   ├── config.ts          # Configuração principal
│   └── theme/
│       ├── index.ts       # Tema customizado
│       └── custom.css     # Estilos personalizados
├── index.md               # Página inicial
├── aprendizado/           # Guias de aprendizado
│   ├── index.md
│   └── guia-aprendizado.md
├── arquitetura/           # Documentação de arquitetura
│   ├── index.md
│   ├── visao-geral.md
│   └── diagrama-visual.md
├── setup/                 # Guias de setup
│   ├── index.md
│   ├── setup-rapido.md
│   ├── docker-compose.md
│   └── criar-usuario.md
└── guides/                # Guias avançados
    ├── index.md
    ├── aws-escalabilidade.md
    ├── endpoints.md
    └── testes.md
```

## Como Iniciar a Documentação

```bash
# Desenvolvimento (hot reload)
npm run docs:dev

# Build para produção
npm run docs:build

# Preview do build
npm run docs:preview
```

## Adicionando Novas Páginas

1. Crie um novo arquivo `.md` na pasta apropriada
2. Adicione o link na configuração `docs/.vitepress/config.ts`
3. Atualize o sidebar conforme necessário

Exemplo:

```typescript
// Em config.ts, na seção sidebar:
{
  text: 'Meu Novo Guia',
  link: '/novo-guia/novo-arquivo'
}
```

## Formatação Markdown

VitePress suporta Markdown padrão com extensões:

### Headings

```markdown
# H1
## H2
### H3
```

### Listas

```markdown
- Item 1
- Item 2
  - Item 2a
  - Item 2b

1. Item numerado
2. Segundo item
```

### Código

```markdown
Inline: `const x = 1`

Bloco:
\`\`\`typescript
const x = 1;
console.log(x);
\`\`\`
```

### Links

```markdown
[Texto do link](./arquivo-local.md)
[Link externo](https://exemplo.com)
```

### Imagens

```markdown
![Alt text](./imagem.png)
```

### Containers (Callouts)

```markdown
::: tip
Dica útil
:::

::: warning
Aviso importante
:::

::: danger
Perigo!
:::

::: details Clique para expandir
Conteúdo escondido
:::
```

### Tabelas

```markdown
| Coluna 1 | Coluna 2 |
|----------|----------|
| Dado 1   | Dado 2   |
| Dado 3   | Dado 4   |
```

## Front Matter

Cada página pode incluir metadados no início:

```markdown
---
layout: home  # ou 'doc'
title: Título Customizado
description: Descrição da página
---

# Conteúdo da página
```

## Customizações

### Alterando Cores

Edite `docs/.vitepress/theme/custom.css` para modificar as variáveis CSS:

```css
:root {
  --vp-c-brand: #8b5cf6;           /* Cor primária */
  --vp-c-brand-light: #a78bfa;
  --vp-c-brand-dark: #7c3aed;
}
```

### Adicionando Componentes Vue

Você pode usar componentes Vue em arquivos `.md`:

```markdown
<template>
  <div>
    {{ message }}
  </div>
</template>

<script setup>
const message = 'Olá!'
</script>
```

## Configuração de Navegação

A navegação é definida em `docs/.vitepress/config.ts`:

```typescript
nav: [
  { text: 'Home', link: '/' },
  { text: 'Guia', link: '/aprendizado/' },
  {
    text: 'Mais',
    items: [
      { text: 'Opção 1', link: '/...' },
      { text: 'Opção 2', link: '/...' }
    ]
  }
]
```

## Pesquisa Local

VitePress inclui busca local por padrão. A configuração está em `config.ts`:

```typescript
search: {
  provider: 'local',
  options: {
    locales: {
      'pt-BR': { /* ... */ }
    }
  }
}
```

## Deploy

### Vercel

```bash
vercel
```

### Netlify

Crie arquivo `netlify.toml`:

```toml
[build]
  command = "npm run docs:build"
  publish = "docs/.vitepress/dist"
```

### GitHub Pages

1. Configure `docs/.vitepress/config.ts` com `base: '/cookme/'`
2. Crie workflow GitHub Actions
3. Push para main

## Boas Práticas

1. **Organize bem**: Agrupe tópicos relacionados
2. **Seja claro**: Use exemplos práticos
3. **Atualize regularmente**: Mantenha a documentação sincronizada
4. **Use imagens**: Diagramas ajudam na compreensão
5. **Escreva em português**: Mantém consistência
6. **Links internos**: Use `[texto](./arquivo.md)` para links internos
7. **Versioning**: Considere documentar múltiplas versões

## Recursos Adicionais

- [Documentação VitePress](https://vitepress.dev/)
- [Markdown Guide](https://www.markdownguide.org/)
- [Vue 3 Documentation](https://vuejs.org/)

---

**Última atualização**: 2024
