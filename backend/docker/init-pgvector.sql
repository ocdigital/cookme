-- Cria a extensão pgvector no primeiro boot do banco.
-- O RAG de receitas depende dela (embeddings de 768 dims) — ver ADR-0001.
-- Executado automaticamente pelo entrypoint do Postgres em
-- /docker-entrypoint-initdb.d/ (só na inicialização de um volume vazio).
CREATE EXTENSION IF NOT EXISTS vector;
