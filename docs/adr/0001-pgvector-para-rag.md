# ADR-0001: pgvector para busca semântica (RAG)

- **Status:** Aceito
- **Data:** 2026-07-22 *(registrado retroativamente — decisão em vigor desde a implementação do RAG)*
- **Decisores:** Equipe CookMe

## Contexto

O CookMe gera receitas a partir dos ingredientes do usuário. Para reaproveitar receitas semelhantes já existentes no banco (em vez de gerar tudo do zero via LLM, o que é lento e caro), é preciso **busca semântica**: dado um conjunto de ingredientes, encontrar as receitas mais próximas no espaço vetorial de embeddings.

Restrições da época:

- O banco principal já era **PostgreSQL** (TypeORM).
- Volume pequeno (~150–330 receitas) — não é escala de milhões de vetores.
- Custo de infra precisa ser mínimo (projeto pré-tração).
- Evitar operar mais um serviço/banco dedicado se possível.

## Decisão

Vamos usar a extensão **pgvector** no próprio PostgreSQL, com índice HNSW e embeddings de 768 dimensões (`gemini-embedding-001`).

A busca usa o operador de distância de cosseno do pgvector diretamente em SQL:

```sql
SELECT *, 1 - (embedding <=> $1::vector) AS similaridade
FROM receitas
ORDER BY embedding <=> $1::vector
LIMIT $2
```

### Alternativas consideradas

- **Pinecone / Weaviate / Qdrant (vector DB dedicado)** — descartado: mais um serviço para operar e pagar, latência de rede extra, e overkill para o volume atual. Ganho real só apareceria em escala de milhões de vetores.
- **Busca por keyword (sem embeddings)** — descartado: não captura similaridade semântica ("frango" ~ "galinha", "macarrão" ~ "espaguete").

## Consequências

- ✅ Zero infra nova — vive no Postgres que já existe. Uma query, um índice.
- ✅ Sem custo adicional de serviço; sem latência de rede entre bancos.
- ✅ Transações e joins com as demais tabelas de receita são triviais (mesmo banco).
- ⚠️ pgvector não escala para bilhões de vetores como um vector DB dedicado. Em escala muito maior, este ADR pode ser **substituído**.
- 🔗 O container Postgres precisa da imagem `pgvector/pgvector:pg16` (não `postgres:latest`), e a extensão `vector` deve estar criada. Isso impacta o setup local e o deploy — ver [How-to: Docker Compose](/how-to/docker-compose).
