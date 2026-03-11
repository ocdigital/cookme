# Existing Documentation Migration Guide

## Overview

This document tracks which markdown files from the root have been organized into the VitePress documentation structure, and which ones remain for reference.

## Files Organized into VitePress

### Aprendizado Section (`/docs/aprendizado/`)

| Original File | Destination | Purpose |
|---------------|-------------|---------|
| GUIA_APRENDIZADO_COOKME.md | docs/aprendizado/guia-aprendizado.md | Complete learning guide with fundamentals |

### Arquitetura Section (`/docs/arquitetura/`)

| Original File | Destination | Purpose |
|---------------|-------------|---------|
| ARQUITETURA.md | docs/arquitetura/visao-geral.md | Technical architecture overview |
| ARQUITETURA_VISUAL.md | docs/arquitetura/diagrama-visual.md | Visual architecture diagrams |

### Setup Section (`/docs/setup/`)

| Original File | Destination | Purpose |
|---------------|-------------|---------|
| SETUP_RAPIDO.md | docs/setup/setup-rapido.md | Quick setup instructions |
| SETUP_COM_DOCKER_COMPOSE.md | docs/setup/docker-compose.md | Docker Compose setup guide |
| COMO_CRIAR_USUARIO.md | docs/setup/criar-usuario.md | User creation guide |

### Guides Section (`/docs/guides/`)

| Original File | Destination | Purpose |
|---------------|-------------|---------|
| GUIA_AWS_ESCALABILIDADE.md | docs/guides/aws-escalabilidade.md | AWS & scalability guide |
| ENDPOINTS_E_PORTAS.md | docs/guides/endpoints.md | API endpoints reference |
| COMECE_AQUI_TESTES.md | docs/guides/testes.md | Testing guide |

## Original Root Files (Preserved)

The following files remain in the project root for reference and can be linked or included as needed:

```
Root Documentation Files:
├── CRONOGRAMA_FINALIZACAO.md
├── LIMPEZA_ARQUIVOS.md
├── FRONTEND_QUICK_GUIDE.md
├── PHASE_1_IMPLEMENTATION_SUMMARY.md
├── BACKEND_ADMIN_API_GUIDE.md
├── LEIA_PRIMEIRO.md
├── IMPLEMENTATION_CHECKLIST.md
├── CLAUDE-PROJECT-BRIEF.md
├── DOCUMENTACAO_CORE.md
├── ADMIN_PRODUCTS_PANEL_GUIDE.md
├── QUICK_REFERENCE.md
├── START_HERE.md
├── CHANGELOG.md
├── BACKEND_FILE_STRUCTURE.md
├── TESTING_GUIDE.md
├── ADMIN_PANEL_IMPLEMENTATION_SUMMARY.md
├── TESTES_CORRIGIDOS.md
├── WHATS_NEW_DECEMBER_2025.md
├── 📖_DOCUMENTATION_INDEX.md
├── BACKEND_EXPLORATION_INDEX.md
├── MOBILE_INTEGRATION.md
├── MONETIZATION_TECHNICAL_PLAN.md
├── README.md
├── BACKEND_MODULES_OVERVIEW.md
├── README_TESTES.md
├── TESTES_CRIADOS.md
├── MONETIZATION_STRATEGY.md
├── SESSION_PROFILE_AND_HEADER_UPDATE.md
├── CONTRIBUTING.md
├── PROJECT_COMPLETION_REPORT.md
└── SESSAO_COMPLETA_SUMARIO.md
```

## Future Migration Candidates

### High Priority (Should be added to VitePress)

These files contain valuable information that should be organized into the docs:

1. **LEIA_PRIMEIRO.md** - Could be a dedicated "Getting Started" section
2. **BACKEND_ADMIN_API_GUIDE.md** - Could go in /guides/backend-api
3. **FRONTEND_QUICK_GUIDE.md** - Could go in /guides/frontend
4. **TESTING_GUIDE.md** - Could enhance /guides/testes
5. **ADMIN_PRODUCTS_PANEL_GUIDE.md** - Could go in /guides/admin-panel
6. **README.md** - Main project README

### Medium Priority

1. **CHANGELOG.md** - Could be in /guides/changelog
2. **CONTRIBUTING.md** - Could be in /guides/contributing
3. **README_TESTES.md** - Could enhance /guides/testes
4. **DOCUMENTACAO_CORE.md** - Core concepts section
5. **BACKEND_FILE_STRUCTURE.md** - Backend architecture

### Lower Priority (Reference Only)

- CRONOGRAMA_FINALIZACAO.md - Timeline/milestone tracking
- PHASE_1_IMPLEMENTATION_SUMMARY.md - Historical implementation notes
- QUICK_REFERENCE.md - Quick reference cards
- IMPLEMENTATION_CHECKLIST.md - Task checklist

## How to Add More Files

### Step 1: Choose a File

Pick a markdown file from the root that should be organized.

Example: `LEIA_PRIMEIRO.md`

### Step 2: Determine Placement

Decide which section it belongs to:
- `/docs/aprendizado/` - Learning/basics
- `/docs/arquitetura/` - Technical architecture
- `/docs/setup/` - Setup & configuration
- `/docs/guides/` - Advanced guides
- Or create a new section if needed

### Step 3: Copy & Rename

```bash
# Copy to appropriate section
cp /home/eduardo/projetos/cookme/LEIA_PRIMEIRO.md \
   /home/eduardo/projetos/cookme/docs/setup/guia-primeiro-passos.md
```

### Step 4: Update Config

Edit `/home/eduardo/projetos/cookme/docs/.vitepress/config.ts`:

```typescript
sidebar: {
  '/setup/': [
    {
      text: 'Configuração',
      items: [
        { text: 'Primeiros Passos', link: '/setup/guia-primeiro-passos' },
        { text: 'Setup Rápido', link: '/setup/setup-rapido' },
        // ... other items
      ]
    }
  ]
}
```

### Step 5: Update Navigation (if needed)

If adding a new section, also update the `nav` array in config.ts.

### Step 6: Test

```bash
npm run docs:dev
# Verify the new page appears and looks correct
```

## Organization Strategy

### Current Structure

```
/docs/
├── aprendizado/    (Learning & fundamentals)
├── arquitetura/    (Technical & architecture)
├── setup/          (Configuration & setup)
└── guides/         (Advanced topics)
```

### Recommended Future Sections

If needed, you can add:

- `/docs/backend/` - Backend specific documentation
- `/docs/frontend/` - Frontend specific documentation
- `/docs/mobile/` - Mobile app documentation
- `/docs/devops/` - Deployment & DevOps
- `/docs/api/` - API reference
- `/docs/faq/` - Frequently Asked Questions
- `/docs/changelog/` - Version history

Example new structure:

```
/docs/
├── aprendizado/
├── arquitetura/
├── setup/
├── guides/
├── backend/        (NEW)
├── frontend/       (NEW)
├── mobile/         (NEW)
├── api/            (NEW)
└── faq/            (NEW)
```

## Benefits of VitePress Organization

1. **Better Navigation**: Structured, easy-to-navigate docs
2. **Search**: Full-text search across all documentation
3. **Consistency**: Uniform formatting and styling
4. **Maintenance**: Easier to update and keep current
5. **Discovery**: Better organization helps finding information
6. **Professional**: Modern, polished appearance
7. **Accessibility**: Responsive, accessible design

## Files to Keep in Root

These files should remain in the project root:

- **README.md** - Project overview (also referenced in docs)
- **CONTRIBUTING.md** - Contribution guidelines
- **package.json** - Project configuration
- **.gitignore**, **.git/** - Git configuration
- **Backend & Frontend folders** - Actual project code

## Next Steps

1. Review the current VitePress structure
2. Identify which root files should be migrated
3. Prioritize high-value content first
4. Follow the "How to Add More Files" process
5. Test after each addition
6. Commit changes to git

## Quick Command to Add a File

```bash
# Generic template to copy and add
ORIGINAL_FILE="LEIA_PRIMEIRO.md"
NEW_LOCATION="docs/setup/guia-primeiro-passos.md"
cp /home/eduardo/projetos/cookme/$ORIGINAL_FILE \
   /home/eduardo/projetos/cookme/$NEW_LOCATION
```

## Verification

After migrating files, verify:

1. File exists in new location: `ls -la /home/eduardo/projetos/cookme/docs/...`
2. Config is updated: Check `/docs/.vitepress/config.ts`
3. Links work: Test in `npm run docs:dev`
4. No broken links: Search for references

## Resources

- See `/docs/DOCUMENTATION_GUIDE.md` for detailed editing instructions
- Check `/docs/README.md` for current structure
- Review `/VITEPRESS_QUICK_START.md` for quick commands

---

**Last Updated**: 2024
**Status**: Migration in progress
**Total Files in Root**: ~40
**Files Organized**: 9
**Files to Review**: ~31

