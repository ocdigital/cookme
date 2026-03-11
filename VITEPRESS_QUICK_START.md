# VitePress Quick Start - CookMe Documentation

## Installation Complete ✓

VitePress foi configurado com sucesso! Aqui está como começar.

## Iniciar em 30 Segundos

```bash
# 1. Vá para a raiz do projeto
cd /home/eduardo/projetos/cookme

# 2. Inicie o servidor de desenvolvimento
npm run docs:dev

# 3. Abra no navegador
# http://localhost:5173
```

## O que Você Vê

A documentação estará disponível com:
- ✓ Página inicial (home) com features
- ✓ 4 Seções: Aprendizado, Arquitetura, Setup, Guias
- ✓ Navegação sidebar automática
- ✓ Busca full-text local
- ✓ Dark/Light mode
- ✓ Responsive design

## Estrutura de Pastas

```
/docs
├── aprendizado/        (Guias de aprendizado)
├── arquitetura/        (Documentação técnica)
├── setup/              (Instruções de setup)
├── guides/             (Guias avançados)
├── .vitepress/         (Configuração)
└── index.md            (Home page)
```

## Editar Documentação

1. Abra qualquer arquivo `.md` em `/docs`
2. Faça suas mudanças
3. Salve o arquivo
4. O navegador recarrega automaticamente!

**Exemplo**: 
```bash
# Editar aprendizado
nano /home/eduardo/projetos/cookme/docs/aprendizado/guia-aprendizado.md
```

## NPM Scripts

```bash
# Desenvolvimento (com hot reload)
npm run docs:dev

# Build para produção
npm run docs:build

# Preview do build
npm run docs:preview

# Aliases simples
npm run dev     # = docs:dev
npm run build   # = docs:build
npm run preview # = docs:preview
```

## Customizações

### Mudar Cores

Edite: `/home/eduardo/projetos/cookme/docs/.vitepress/theme/custom.css`

```css
:root {
  --vp-c-brand: #8b5cf6;  /* Cor principal (purple) */
  --vp-c-brand-light: #a78bfa;
  --vp-c-brand-dark: #7c3aed;
}
```

### Mudar Título/Descrição

Edite: `/home/eduardo/projetos/cookme/docs/.vitepress/config.ts`

```typescript
export default defineConfig({
  title: 'CookMe Documentation',
  description: 'Sua descrição aqui',
  // ...
})
```

### Adicionar Nova Página

1. Crie arquivo em `/docs/secao/arquivo.md`
2. Edite `/docs/.vitepress/config.ts`
3. Adicione ao `nav` ou `sidebar`

Exemplo:
```typescript
sidebar: {
  '/aprendizado/': [
    {
      text: 'Aprendizado',
      items: [
        { text: 'Novo Arquivo', link: '/aprendizado/novo-arquivo' },
      ]
    }
  ]
}
```

## Markdown Cheat Sheet

```markdown
# Título H1
## Título H2

**Bold** | *Italic* | `Código inline`

- Lista
  - Sublista
  - Item

1. Numerado
2. Segundo

[Link](https://exemplo.com)

![Imagem](./img.png)

| Tabela | Coluna |
|--------|--------|
| Dado 1 | Dado 2 |

::: tip
Dica útil
:::

::: warning
Aviso importante
:::

::: danger
Perigo!
:::

\`\`\`typescript
const code = 'example';
\`\`\`
```

## Arquivos Importantes

| Arquivo | Propósito |
|---------|-----------|
| `/package.json` | Scripts NPM |
| `/docs/.vitepress/config.ts` | Configuração principal |
| `/docs/.vitepress/theme/custom.css` | Estilos customizados |
| `/docs/index.md` | Home page |
| `/docs/DOCUMENTATION_GUIDE.md` | Guia completo |

## Próximas Etapas

### 1. Testar Localmente
```bash
npm run docs:dev
# Navegue em http://localhost:5173
```

### 2. Deploy
- [Vercel](https://vercel.com) - Recomendado (1-click deploy)
- [Netlify](https://netlify.com)
- [GitHub Pages](https://pages.github.com)

### 3. Expandir Documentação
- Veja `/docs/DOCUMENTATION_GUIDE.md`
- Adicione mais páginas conforme necessário

## Troubleshooting

### Erro de porta
```bash
npm run docs:dev -- --port 5174
```

### Limpar cache
```bash
rm -rf /home/eduardo/projetos/cookme/docs/.vitepress/cache
npm run docs:dev
```

### Verificar instalação
```bash
npm list vitepress vue
# Deve mostrar as versões instaladas
```

## URLs Úteis

- **Local Development**: http://localhost:5173
- **VitePress Docs**: https://vitepress.dev/
- **Markdown Guide**: https://www.markdownguide.org/

## Dúvidas?

1. Veja `/docs/DOCUMENTATION_GUIDE.md` para detalhes
2. Consulte `/docs/README.md` para estrutura
3. Verifique `/VITEPRESS_SETUP_SUMMARY.md` para configuração completa

---

**Status**: ✓ Pronto para usar
**Versão**: 1.0.0
**Data**: 2024
