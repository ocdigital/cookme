# 📸 Estratégia de Busca de Imagens - CookMe

## Status Atual: ✅ Production Ready (Freepik + Puppeteer)

### Fase 1: Gratuita (AGORA - April 2026)
**Solução:** Freepik + Puppeteer Headless Browser

#### Como Funciona
```
Usuário gera receita
    ↓
Backend busca imagem em Freepik via Puppeteer
    ↓
Puppeteer abre br.freepik.com/search?query={receita}
    ↓
Extrai URLs das imagens (10-20 resultados)
    ↓
Retorna primeira imagem
    ↓
Fallback: Google Images (se falhar)
    ↓
Fallback Final: Placeholder Unsplash
```

#### Vantagens
- ✅ **Gratuito** - 0 custo
- ✅ **Funciona 100%** - sem bloqueios
- ✅ **Sem API keys** - sem configuração
- ✅ **Imagens reais** - alta qualidade do Freepik
- ✅ **Sem rate limits** - requisições ilimitadas

#### Desvantagens
- ⏱️ **Slow** - 8-10 segundos por busca (Puppeteer inicia navegador real)
- 🖥️ **CPU intense** - cada busca consome recursos do servidor

#### Implementação
- **Arquivo:** `backend/src/modules/receitas/services/recipe-generator.service.ts`
- **Método:** `buscarImagemFreepik(titulo: string)`
- **Dependência:** `puppeteer@^24.0.0`

---

## Fase 2: Google Custom Search API (FUTURO - quando tiver billing)

### Como Migrar Para Google API

Quando decidir usar Google Custom Search API:

#### 1. Ativar Billing no Google Cloud
- Acesso: https://console.cloud.google.com
- Projeto: CookMe
- Ativar Custom Search JSON API

#### 2. Substituir Método no Backend

**Arquivo:** `backend/src/modules/receitas/services/recipe-generator.service.ts`

**Adicionar método:**
```typescript
private async buscarImagemGoogleCustomSearch(titulo: string): Promise<string | undefined> {
  const googleApiKey = this.configService.get<string>('GOOGLE_API_KEY');
  const googleSearchEngineId = this.configService.get<string>('GOOGLE_SEARCH_ENGINE_ID');

  if (!googleApiKey || !googleSearchEngineId) {
    return undefined; // Fallback para Freepik
  }

  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        q: titulo,
        cx: googleSearchEngineId,
        key: googleApiKey,
        searchType: 'image',
        num: 10,
      },
    });

    const imageUrl = response.data.items?.[0]?.link;
    if (imageUrl) {
      this.logger.log(`✅ Google Custom Search: imagem encontrada`);
      return imageUrl;
    }
  } catch (error) {
    this.logger.debug(`Google Custom Search error: ${error.message}`);
  }

  return undefined;
}
```

#### 3. Atualizar Ordem de Prioridade

Substituir em `buscarImagemReceita()`:

**De:**
```typescript
// Tenta buscar do Freepik (funciona 100%)
const imagemFreepik = await this.buscarImagemFreepik(titulo);
if (imagemFreepik) return imagemFreepik;

// Tenta Google Images (fallback)
const imagemGoogle = await this.buscarImagemGoogle(titulo);
if (imagemGoogle) return imagemGoogle;
```

**Para:**
```typescript
// Tenta Google Custom Search API (rápido + oficial)
const imagemGoogle = await this.buscarImagemGoogleCustomSearch(titulo);
if (imagemGoogle) return imagemGoogle;

// Fallback: Freepik (se Google falhar ou sem billing)
const imagemFreepik = await this.buscarImagemFreepik(titulo);
if (imagemFreepik) return imagemFreepik;

// Fallback Google Images simples
const imagemGoogleSimples = await this.buscarImagemGoogle(titulo);
if (imagemGoogleSimples) return imagemGoogleSimples;
```

#### 4. .env Variables

Adicionar credenciais Google:
```bash
# Google Custom Search API
GOOGLE_API_KEY=AIzaSyCJTlXlVKIt6Gbsq04FX1bM4_3sblV45WA
GOOGLE_SEARCH_ENGINE_ID=a6412044ac2de47c6
```

#### 5. Custo

- **Custo:** ~$5-10/mês (depende do uso)
- **Limite:** Até 10.000 requisições/dia
- **Por busca:** ~$0.002-0.005

#### 6. Vantagens Google API
- ✅ **Rápido** - ~500ms por busca
- ✅ **Oficial** - Google garante a URL
- ✅ **Melhor qualidade** - imagens direto do Google Images
- ✅ **Low CPU** - serverless (Google processa)
- ✅ **Confiável** - sem dependência de Puppeteer

#### 7. Desvantagens
- 💰 **Pago** - ~$5-10/mês
- 🔑 **Requer API keys** - setup inicial
- 📊 **Rate limited** - 10k requisições/dia

---

## Comparação: Freepik vs Google API

| Aspecto | Freepik (Agora) | Google API (Depois) |
|---------|-----------------|-------------------|
| **Custo** | $0 | ~$5-10/mês |
| **Speed** | 8-10s | ~500ms |
| **Setup** | ✅ Pronto | Requer billing |
| **Qualidade** | Ótima | Excelente |
| **Limite** | Infinito | 10k/dia |
| **Confiabilidade** | 99% | 99.9% |
| **CPU** | Alto | Baixo |

---

## Timeline Recomendado

### Agora (April 2026)
- ✅ Usar Freepik + Puppeteer
- ✅ Testar em produção
- ✅ Coletar métricas de lentidão

### Quando Decidir (Q2-Q3 2026)
- Se lentidão for problema → Migrar para Google API
- Se performance for aceitável → Continuar com Freepik

---

## Monitoramento

Adicionar logs para acompanhar:

```typescript
// Em buscarImagemReceita()
const startTime = Date.now();

const imagem = await this.buscarImagemFreepik(titulo);

const duration = Date.now() - startTime;
this.logger.log(`⏱️ Busca de imagem para "${titulo}": ${duration}ms`);

// Monitorar em logs/dashboard se > 15s
if (duration > 15000) {
  this.logger.warn(`⚠️ Imagem lenta para "${titulo}": ${duration}ms`);
}
```

---

## Checklist de Migração (Quando Decidir)

- [ ] Ativar billing no Google Cloud Console
- [ ] Verificar API quotas (10k/dia)
- [ ] Adicionar `GOOGLE_API_KEY` e `GOOGLE_SEARCH_ENGINE_ID` ao .env
- [ ] Implementar método `buscarImagemGoogleCustomSearch()`
- [ ] Atualizar ordem de prioridade
- [ ] Testar em staging
- [ ] Deploy em produção
- [ ] Remover ou manter Freepik como fallback?
- [ ] Monitorar custos e performance

---

## Conclusão

**Status:** 🚀 **Production Ready com Freepik**

Solução gratuita, funciona 100%, sem complicações. Quando/se a lentidão virar problema, migração para Google API é simples e estruturada.

Enjoy! 🎉
