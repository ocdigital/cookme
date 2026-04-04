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
  imagem_url?: string;
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

    const prompt = `Você é um chef experiente de culinária brasileira.

Dados estes ingredientes disponíveis: ${ingredientes.join(', ')}

Gere 3 receitas criativas e práticas que usem ALGUNS destes ingredientes (não precisa usar todos, mas use pelo menos 2 de cada receita).

IMPORTANTE: Retorne APENAS um JSON array válido, sem markdown, sem explicações adicionais, sem blocos de código.

Formato exato esperado:
[
  {
    "titulo": "Nome descritivo da receita",
    "descricao": "Uma frase curta sobre o prato",
    "tempo_preparo": "20 minutos",
    "dificuldade": "fácil",
    "ingredientes": ["ingrediente 1", "ingrediente 2", "ingrediente 3"],
    "modo_preparo": "Passo 1. Descrição.\\nPasso 2. Descrição.",
    "rendimento": "2 porções"
  }
]

Lembre-se: APENAS JSON, NADA MAIS.`;

    let receitas: Receita[] = [];

    // Tenta Gemini primeiro (mais confiável e disponível)
    if (this.geminiKey) {
      try {
        this.logger.log('Trying Gemini API...');
        receitas = await this.gerarComGemini(prompt);
      } catch (error) {
        this.logger.warn(`Gemini failed: ${error}`);
      }
    }

    // Fallback para Claude
    if (receitas.length === 0 && this.claudeClient) {
      try {
        this.logger.log('Trying Claude API...');
        receitas = await this.gerarComClaude(prompt);
      } catch (error: any) {
        this.logger.error(`Claude error: ${error.message || error}`);
      }
    }

    // Se tudo falhar, retorna mock
    if (receitas.length === 0) {
      this.logger.log('Using mock recipes');
      receitas = this.getReceitasMock(ingredientes);
    }

    // Buscar imagens para cada receita em paralelo
    this.logger.log(`🖼️ Buscando imagens para ${receitas.length} receitas...`);
    const receitasComImagens = await Promise.all(
      receitas.map(async (receita) => {
        this.logger.log(`📸 Procurando imagem para: "${receita.titulo}"`);
        const imagem_url = await this.buscarImagemReceita(receita.titulo);
        this.logger.log(`${imagem_url ? '✅' : '❌'} "${receita.titulo}" → ${imagem_url ? 'OK' : 'SEM IMAGEM'}`);
        return {
          ...receita,
          imagem_url,
        };
      })
    );

    this.logger.log(`✨ Imagens buscadas! ${receitasComImagens.filter(r => r.imagem_url).length}/${receitas.length} com sucesso`);
    return receitasComImagens;
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiKey}`,
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

    let text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Remove markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      text = jsonMatch[1];
    }

    // Try to parse as array first, then wrap if single object
    let receitas: Receita[] = [];
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      receitas = parsed;
    } else {
      // If it's a single recipe, wrap it in array and normalize fields
      receitas = [{
        titulo: parsed.titulo || parsed.nome || '',
        descricao: parsed.descricao || '',
        tempo_preparo: parsed.tempo_preparo || `${parsed.tempo_preparo_minutos || 30} minutos`,
        dificuldade: (parsed.dificuldade || 'médio').toLowerCase() as 'fácil' | 'médio' | 'difícil',
        ingredientes: parsed.ingredientes?.map((ing: any) =>
          typeof ing === 'string' ? ing : `${ing.item} - ${ing.quantidade}`
        ) || [],
        modo_preparo: Array.isArray(parsed.instrucoes)
          ? parsed.instrucoes.join('\n')
          : parsed.modo_preparo || '',
        rendimento: parsed.rendimento || `${parsed.rendimento_porcoes || 2} porções`,
      }];
    }

    this.logger.log(`Recipes generated with Gemini (${receitas.length} recipes)`);
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

  /**
   * Busca imagem do prato usando múltiplas estratégias
   */
  async buscarImagemReceita(titulo: string): Promise<string | undefined> {
    try {
      this.logger.debug(`🔍 Buscando imagem para: "${titulo}"`);

      // Tenta buscar do Google Images
      const imagemGoogle = await this.buscarImagemGoogle(titulo);
      if (imagemGoogle && imagemGoogle.startsWith('http')) {
        this.logger.log(`✅ Imagem Google encontrada para "${titulo}"`);
        return imagemGoogle;
      }

      // Fallback final: placeholder genérico
      const placeholders = [
        'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1504674900967-60f4a61f5a6e?w=400&h=300&fit=crop',
      ];
      const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)];
      this.logger.log(`⚠️ Usando placeholder para "${titulo}"`);
      return randomPlaceholder;
    } catch (error: any) {
      this.logger.error(`❌ Erro ao buscar imagem para "${titulo}": ${error.message}`);
      return 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop';
    }
  }

  /**
   * Busca imagem no Google Images usando padrão AF_initDataCallback
   * Técnica baseada em: https://dev.to/serpapi/web-scraping-google-images-with-nodejs-1c9g
   */
  private async buscarImagemGoogle(titulo: string): Promise<string | undefined> {
    try {
      const query = encodeURIComponent(titulo);
      const googleImagesUrl = `https://www.google.com/search?q=${query}&tbm=isch&hl=pt-BR`;

      this.logger.log(`🔍 Buscando em Google Images: ${titulo}`);

      const response = await axios.get(googleImagesUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 10000,
      });

      // Padrão 1: Buscar por AF_initDataCallback que contém as URLs
      this.logger.log(`📄 Resposta Google Images: ${response.data.length} chars`);

      const hasCallback = response.data.includes('AF_initDataCallback');
      this.logger.log(`${hasCallback ? '✓' : '✗'} AF_initDataCallback present`);

      // Tenta encontrar a primeira URL de imagem na resposta
      const urlMatches = response.data.match(/https?:\/\/[^\s"<>]+\.(?:jpg|jpeg|png|gif|webp)/gi) || [];
      this.logger.log(`🔍 URLs encontradas: ${urlMatches.length}`);

      if (urlMatches && urlMatches.length > 0) {
        // Filtra URLs que parecem ser de imagens reais (não cache do Google)
        const realImageUrl = urlMatches.find(url =>
          !url.includes('google.com') &&
          !url.includes('gstatic.com') &&
          url.length > 50
        );

        if (realImageUrl) {
          this.logger.log(`✅ Imagem encontrada: ${realImageUrl.substring(0, 80)}`);
          return realImageUrl;
        }
      }

      // Padrão 2: Buscar por "ou":"URL" (fallback)
      const imageMatch = response.data.match(/"ou":"([^"]+)"/);
      if (imageMatch && imageMatch[1] && imageMatch[1].startsWith('http')) {
        this.logger.log(`✅ Imagem encontrada (padrão ou): ${imageMatch[1].substring(0, 80)}`);
        return imageMatch[1];
      }

      this.logger.log(`⚠️ Nenhuma imagem encontrada para "${titulo}"`);
      return undefined;
    } catch (error: any) {
      this.logger.debug(`Google Images error: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Extrai URLs de imagens da estrutura JSON do Google
   */
  private extrairURLsDoJSON(data: any): string[] {
    const urls: string[] = [];

    const buscar = (obj: any): void => {
      if (Array.isArray(obj)) {
        for (const item of obj) {
          if (typeof item === 'string' && item.startsWith('http')) {
            if (item.includes('.jpg') || item.includes('.jpeg') || item.includes('.png') || item.includes('.webp') || item.includes('.gif')) {
              urls.push(item);
            }
          } else {
            buscar(item);
          }
        }
      } else if (obj && typeof obj === 'object') {
        for (const key in obj) {
          buscar(obj[key]);
        }
      }
    };

    buscar(data);
    return urls;
  }
}
