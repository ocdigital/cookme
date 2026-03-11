import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ClassificacaoResult {
  categoria: string;
  tipo: 'ALIMENTO' | 'NAO_ALIMENTO';
  unidade_sugerida: string;
  confianca: number;
  tags: string[];
  informacoes_nutricionais?: {
    calorias?: number;
    proteinas?: number;
    carboidratos?: number;
    gorduras?: number;
  };
}

@Injectable()
export class IAService {
  private readonly claudeApiKey: string;
  private readonly geminiApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.claudeApiKey = this.configService.get<string>('CLAUDE_API_KEY') || '';
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  /**
   * Classifica um produto usando IA (Claude)
   */
  async classificarProduto(nomeProduto: string): Promise<ClassificacaoResult> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Classifique o seguinte produto de supermercado: "${nomeProduto}"

Retorne APENAS um JSON válido (sem markdown) com:
{
  "categoria": "nome da categoria (arroz, feijão, carnes, etc)",
  "tipo": "ALIMENTO ou NAO_ALIMENTO",
  "unidade_sugerida": "KG, L, UN, etc",
  "confianca": 0.0 a 1.0,
  "tags": ["vegano", "sem-gluten", etc],
  "informacoes_nutricionais": {
    "calorias": número por 100g/ml,
    "proteinas": número em gramas,
    "carboidratos": número em gramas,
    "gorduras": número em gramas
  }
}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const content = data.content[0].text;

      // Extrair JSON do texto
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta inválida da IA');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Erro ao classificar produto com IA:', error);
      // Retornar classificação padrão em caso de erro
      return {
        categoria: 'Geral',
        tipo: 'ALIMENTO',
        unidade_sugerida: 'UN',
        confianca: 0.5,
        tags: [],
      };
    }
  }

  /**
   * Gera uma receita baseada em ingredientes disponíveis
   */
  async gerarReceita(ingredientes: string[], preferencias?: {
    tipo?: string;
    tempo_preparo?: number;
    dificuldade?: string;
    restricoes?: string[];
  }) {
    try {
      const prompt = `Crie uma receita usando os seguintes ingredientes: ${ingredientes.join(', ')}

${preferencias?.tipo ? `Tipo: ${preferencias.tipo}` : ''}
${preferencias?.tempo_preparo ? `Tempo máximo: ${preferencias.tempo_preparo} minutos` : ''}
${preferencias?.dificuldade ? `Dificuldade: ${preferencias.dificuldade}` : ''}
${preferencias?.restricoes ? `Restrições: ${preferencias.restricoes.join(', ')}` : ''}

Retorne APENAS um JSON válido (sem markdown) com:
{
  "titulo": "nome da receita",
  "descricao": "breve descrição",
  "tempo_preparo": minutos,
  "porcoes": número,
  "dificuldade": "FACIL, MEDIA ou DIFICIL",
  "ingredientes": [
    {
      "nome": "ingrediente",
      "quantidade": número,
      "unidade": "UN, KG, L, etc"
    }
  ],
  "modo_preparo": ["passo 1", "passo 2", ...],
  "tags": ["vegetariano", "rapido", etc],
  "informacoes_nutricionais": {
    "calorias_por_porcao": número,
    "proteinas": gramas,
    "carboidratos": gramas,
    "gorduras": gramas
  }
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      const content = data.content[0].text;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta inválida da IA');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Erro ao gerar receita com IA:', error);
      throw error;
    }
  }

  /**
   * Sugere compras baseado no inventário e receitas
   */
  async sugerirCompras(inventario: any[], receitasDesejadas: any[]) {
    try {
      const prompt = `Baseado no seguinte inventário:
${JSON.stringify(inventario, null, 2)}

E nas receitas desejadas:
${JSON.stringify(receitasDesejadas, null, 2)}

Sugira uma lista de compras inteligente.

Retorne APENAS um JSON válido (sem markdown) com:
{
  "sugestoes": [
    {
      "produto": "nome do produto",
      "quantidade": número,
      "unidade": "KG, L, UN",
      "prioridade": "ALTA, MEDIA, BAIXA",
      "motivo": "para fazer [receita] / repor estoque / etc"
    }
  ],
  "economia_estimada": "dicas para economizar",
  "alternativas": [
    {
      "produto": "produto original",
      "alternativa": "produto substituto mais barato"
    }
  ]
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      const content = data.content[0].text;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta inválida da IA');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Erro ao sugerir compras com IA:', error);
      throw error;
    }
  }

  /**
   * Analisa informações nutricionais de um produto
   */
  async analisarNutricional(nomeProduto: string, porcao?: number) {
    try {
      const prompt = `Forneça uma análise nutricional detalhada para: "${nomeProduto}"
${porcao ? `Porção: ${porcao}g` : 'Porção padrão: 100g'}

Retorne APENAS um JSON válido (sem markdown) com:
{
  "produto": "${nomeProduto}",
  "porcao": ${porcao || 100},
  "calorias": número,
  "macronutrientes": {
    "proteinas": gramas,
    "carboidratos": gramas,
    "gorduras": gramas,
    "fibras": gramas
  },
  "micronutrientes": {
    "sodio": mg,
    "acucares": gramas,
    "calcio": mg,
    "ferro": mg,
    "vitamina_c": mg
  },
  "classificacao": "Muito saudável / Saudável / Moderado / Evitar",
  "beneficios": ["benefício 1", "benefício 2"],
  "alertas": ["alerta 1 se houver"],
  "sugestao_consumo": "texto com sugestão"
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1536,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      const content = data.content[0].text;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta inválida da IA');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Erro ao analisar nutricional com IA:', error);
      throw error;
    }
  }
}
