import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  private readonly logger = new Logger('RecipeGeneratorService');
  private claudeClient: Anthropic | null;
  private geminiKey: string;

  constructor(private readonly configService: ConfigService) {
    try {
      const apiKey = this.configService.get<string>('CLAUDE_API_KEY');
      this.logger.log(`CLAUDE_API_KEY exists: ${!!apiKey}`);

      if (!apiKey) {
        throw new Error('CLAUDE_API_KEY não configurada');
      }

      this.claudeClient = new Anthropic({
        apiKey,
      });
      this.logger.log('Claude API initialized successfully');
    } catch (error: any) {
      this.logger.error(`Error initializing Claude: ${error.message}`);
      this.claudeClient = null;
    }

    this.geminiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.logger.log(`GEMINI_API_KEY exists: ${!!this.geminiKey}`);
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
        this.logger.log('Trying Claude API...');
        const resultado = await this.gerarComClaude(prompt);
        return resultado;
      } catch (error: any) {
        this.logger.error(`Claude error: ${error.message || error}`);
      }
    } else {
      this.logger.warn('Claude client not available');
    }

    // Fallback para Gemini
    if (this.geminiKey) {
      try {
        this.logger.log('Trying Gemini API...');
        return await this.gerarComGemini(prompt);
      } catch (error) {
        this.logger.warn(`Gemini failed: ${error}`);
      }
    }

    // Se tudo falhar, retorna mock
    this.logger.log('Using mock recipes');
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
    this.logger.log('Recipes generated with Claude');
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
    this.logger.log('Recipes generated with Gemini');
    return receitas;
  }

  private getReceitasMock(ingredientes: string[]): Receita[] {
    const ingred1 = ingredientes.slice(0, 2).join(', ') || 'vegetais';
    const ingred2 = ingredientes.slice(1, 3).join(', ') || 'ingredientes selecionados';
    const ingred3 = ingredientes.slice(0, 4).join(', ') || 'ingredientes disponíveis';

    return [
      {
        titulo: `Prato com ${ingredientes[0] || 'Vegetais'}`,
        descricao: `Receita deliciosa usando ${ingred1}`,
        tempo_preparo: '15 minutos',
        dificuldade: 'fácil',
        ingredientes: ingredientes.slice(0, 3),
        modo_preparo: `1. Prepare ${ingredientes[0] || 'os ingredientes'}
2. Tempere conforme seu gosto
3. Cozinhe em fogo médio por 10-15 minutos
4. Sirva quente e aproveite`,
        rendimento: '2 porções',
      },
      {
        titulo: `Refogado com ${ingredientes[1] || 'Ingredientes Selecionados'}`,
        descricao: `Refogado prático usando ${ingred2}`,
        tempo_preparo: '20 minutos',
        dificuldade: 'fácil',
        ingredientes: ingredientes.slice(0, 4),
        modo_preparo: `1. Aqueça óleo em uma panela
2. Adicione ${ingredientes.slice(0, 2).join(' e ') || 'seus ingredientes'}
3. Refogue até ficar macio (cerca de 10 minutos)
4. Tempere e sirva acompanhado`,
        rendimento: '3 porções',
      },
      {
        titulo: `Combinação Especial`,
        descricao: `Prato completo com ${ingred3}`,
        tempo_preparo: '30 minutos',
        dificuldade: 'médio',
        ingredientes: ingredientes.slice(0, 5),
        modo_preparo: `1. Prepare todos os ${ingredientes.length} ingredientes
2. Cozinhe os que precisam de mais tempo primeiro
3. Combine gradualmente os outros
4. Ajuste tempero e deixar em fogo baixo por 5 minutos
5. Sirva em prato quente`,
        rendimento: '4 porções',
      },
    ];
  }
}
