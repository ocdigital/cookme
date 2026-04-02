import { Injectable } from '@nestjs/common';
import { Anthropic } from '@anthropic-ai/sdk';

export interface Receita {
  titulo: string;
  descricao: string;
  tempo_preparo: string;
  dificuldade: 'fácil' | 'médio' | 'difícil';
  ingredientes: string[];
  modo_preparo: string;
  rendimento: string;
}

@Injectable()
export class RecipeGeneratorService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
  }

  async gerarReceitas(ingredientes: string[]): Promise<Receita[]> {
    if (ingredientes.length === 0) {
      return [];
    }

    const prompt = `Você é um chef de culinária. Dado esta lista de ingredientes: ${ingredientes.join(', ')}

Gere 3 receitas criativas que usem ALGUNS destes ingredientes (não precisa usar todos).

Retorne APENAS um JSON array válido, sem markdown ou explicação adicional. Formato:
[
  {
    "titulo": "Nome da Receita",
    "descricao": "Descrição curta",
    "tempo_preparo": "30 minutos",
    "dificuldade": "fácil",
    "ingredientes": ["ingrediente 1", "ingrediente 2"],
    "modo_preparo": "Instruções passo a passo",
    "rendimento": "4 porções"
  }
]`;

    try {
      const message = await this.client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Resposta não é texto');
      }

      // Parse JSON da resposta
      const receitas = JSON.parse(content.text);
      return receitas;
    } catch (error) {
      console.error('Erro ao gerar receitas:', error);
      // Retornar receitas mock em caso de erro
      return this.getReceitasMock(ingredientes);
    }
  }

  private getReceitasMock(ingredientes: string[]): Receita[] {
    return [
      {
        titulo: 'Salada Nutritiva',
        descricao: 'Uma salada fresca e saudável',
        tempo_preparo: '10 minutos',
        dificuldade: 'fácil',
        ingredientes: ingredientes.slice(0, 3),
        modo_preparo: '1. Lave e corte os vegetais\n2. Misture em uma tigela\n3. Adicione tempero a gosto',
        rendimento: '2 porções',
      },
      {
        titulo: 'Refogado Rápido',
        descricao: 'Refogado colorido e saboroso',
        tempo_preparo: '15 minutos',
        dificuldade: 'fácil',
        ingredientes: ingredientes.slice(0, 4),
        modo_preparo: '1. Aqueça óleo\n2. Refogue os ingredientes\n3. Tempere e sirva',
        rendimento: '3 porções',
      },
      {
        titulo: 'Prato Completo',
        descricao: 'Uma refeição balanceada',
        tempo_preparo: '30 minutos',
        dificuldade: 'médio',
        ingredientes: ingredientes,
        modo_preparo: '1. Prepare a base\n2. Cozinhe os ingredientes\n3. Finalize e sirva quente',
        rendimento: '4 porções',
      },
    ];
  }
}
