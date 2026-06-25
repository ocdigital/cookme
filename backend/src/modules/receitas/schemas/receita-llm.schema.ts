import { z } from 'zod';

export const ReceitaLLMSchema = z.object({
  titulo: z.string().min(2).max(200),
  descricao: z.string().max(500).default(''),
  ingredientes: z.array(z.string()).min(1),
  modo_preparo: z.string().min(10),
  tempo_preparo: z.union([z.string(), z.number()]).transform((v) => String(v)),
  dificuldade: z.enum(['fácil', 'médio', 'difícil']).default('médio'),
  rendimento: z.string().default('4 porções'),
  tags_dieta: z
    .array(z.enum(['vegetariano', 'vegano', 'fitness']))
    .default([]),
});

export type ReceitaLLM = z.infer<typeof ReceitaLLMSchema>;

export const ReceitaArrayLLMSchema = z.array(ReceitaLLMSchema);

export const ReceitaRAGSchema = ReceitaLLMSchema.extend({
  baseada_em: z.string().optional(),
});
