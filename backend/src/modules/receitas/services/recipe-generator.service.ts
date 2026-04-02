import { Injectable } from '@nestjs/common';
import { Anthropic } from '@anthropic-ai/sdk';
import axios from 'axios';

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
  private claudeClient: Anthropic | null;
  private geminiKey: string;

  constructor() {
    try {
      const apiKey = process.env.CLAUDE_API_KEY;
      console.log('🔍 CLAUDE_API_KEY existe?', !!apiKey);

      if (!apiKey) {
        throw new Error('CLAUDE_API_KEY não configurada');
      }

      this.claudeClient = new Anthropic({
        apiKey,
      });
      console.log('✅ Claude API inicializada com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao inicializar Claude:', error.message);
      this.claudeClient = null;
    }

    this.geminiKey = process.env.GEMINI_API_KEY || '';
    console.log('🔍 GEMINI_API_KEY existe?', !!this.geminiKey);
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

    // Tenta Claude primeiro
    if (this.claudeClient) {
      try {
        console.log('📍 Tentando Claude API...');
        const resultado = await this.gerarComClaude(prompt);
        return resultado;
      } catch (error: any) {
        console.error('❌ Claude ERRO:', error.message || error);
      }
    } else {
      console.log('⚠️ Claude client não disponível');
    }

    // Fallback para Gemini
    if (this.geminiKey) {
      try {
        console.log('📍 Tentando Gemini API...');
        return await this.gerarComGemini(prompt);
      } catch (error) {
        console.warn('⚠️ Gemini falhou:', error);
      }
    }

    // Se tudo falhar, retorna mock
    console.log('📍 Usando receitas mock');
    return this.getReceitasMock(ingredientes);
  }

  private async gerarComClaude(prompt: string): Promise<Receita[]> {
    if (!this.claudeClient) throw new Error('Claude não disponível');

    const message = await this.claudeClient.messages.create({
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

    const receitas = JSON.parse(content.text);
    console.log('✅ Receitas geradas com Claude');
    return receitas;
  }

  private async gerarComGemini(prompt: string): Promise<Receita[]> {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const receitas = JSON.parse(text);
    console.log('✅ Receitas geradas com Gemini');
    return receitas;
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
