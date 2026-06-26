import { Injectable, Logger } from '@nestjs/common';
import { Anthropic } from '@anthropic-ai/sdk';

export interface ClassifiedProduct {
  nome: string;
  categoria: 'alimento' | 'bebida_alcoolica' | 'bebida_nao_alcoolica' | 'limpeza' | 'higiene' | 'outro';
  confianca: number; // 0-100
  motivo: string;
  ingrediente_receita: boolean; // Se pode ser usado em receita
}

export interface ClassificationResult {
  produtos_filtrados: ClassifiedProduct[];
  alimentos_disponiveis: string[]; // Só nomes dos que são alimentos
  rejeitados: ClassifiedProduct[]; // Limpeza, higiene, etc
  resumo: {
    total: number;
    alimentos: number;
    rejeitados: number;
  };
}

@Injectable()
export class ProductClassifierService {
  private readonly logger = new Logger(ProductClassifierService.name);
  private readonly anthropic: Anthropic | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  /**
   * Classifica produtos do cupom usando IA (Claude)
   * Determina quais são alimentos/ingredientes vs limpeza/higiene
   */
  async classifyProducts(
    productNames: string[],
  ): Promise<ClassificationResult> {
    if (productNames.length === 0) {
      return {
        produtos_filtrados: [],
        alimentos_disponiveis: [],
        rejeitados: [],
        resumo: {
          total: 0,
          alimentos: 0,
          rejeitados: 0,
        },
      };
    }

    try {
      this.logger.debug(
        `Classificando ${productNames.length} produtos do cupom`,
      );

      // Montar prompt para IA
      const productList = productNames
        .map((name, idx) => `${idx + 1}. ${name}`)
        .join('\n');

      const prompt = `Você é um especialista em classificação de produtos de compras. Analise os produtos abaixo e classifique cada um.

Para cada produto, determine:
1. Se é um ALIMENTO (pode ser usado em receita culinária)
2. Se é uma BEBIDA ALCOÓLICA
3. Se é uma BEBIDA NÃO-ALCOÓLICA (pode ter ingredientes culinários)
4. Se é LIMPEZA (detergente, desinfetante, etc)
5. Se é HIGIENE (sabonete, shampoo, etc)
6. Se é OUTRO

**IMPORTANTE**: Só alimentos e ALGUMAS bebidas (como leite, suco) podem ser ingredientes em receitas.

Produtos para classificar:
${productList}

Responda em JSON válido com este formato exato:
{
  "classificacoes": [
    {
      "nome": "Nome exato do produto",
      "categoria": "alimento|bebida_alcoolica|bebida_nao_alcoolica|limpeza|higiene|outro",
      "confianca": 95,
      "motivo": "Explicação breve",
      "eh_ingrediente": true/false
    }
  ]
}

REGRAS:
- Alimentos: arroz, feijão, óleo, sal, açúcar, pão, etc = eh_ingrediente: true
- Bebidas alcoólicas (cerveja, vinho): eh_ingrediente: false
- Suco, leite, água: eh_ingrediente: true (usadas em receitas)
- Limpeza, higiene: eh_ingrediente: false
- Confiança: 100 se tem certeza, 80 se menos certo, 60 se incerto`;

      if (!this.anthropic) throw new Error('Anthropic API key não configurada');
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extrair resposta
      const responseText =
        message.content[0].type === 'text' ? message.content[0].text : '';

      // Parse JSON da resposta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Nenhum JSON encontrado na resposta da IA');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const classificacoes: ClassifiedProduct[] =
        parsed.classificacoes || [];

      // Filtrar: só alimentos com ingrediente_receita = true
      const alimentos = classificacoes.filter(
        (p) => p.ingrediente_receita === true,
      );
      const rejeitados = classificacoes.filter(
        (p) => p.ingrediente_receita !== true,
      );

      this.logger.log(
        `Classificação concluída: ${alimentos.length} alimentos, ${rejeitados.length} rejeitados`,
      );

      return {
        produtos_filtrados: classificacoes,
        alimentos_disponiveis: alimentos.map((p) => p.nome),
        rejeitados,
        resumo: {
          total: classificacoes.length,
          alimentos: alimentos.length,
          rejeitados: rejeitados.length,
        },
      };
    } catch (error) {
      this.logger.error('Erro ao classificar produtos:', error);
      throw new Error(
        `Falha ao classificar produtos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Versão rápida para testing sem IA - usa regras simples
   */
  classifyProductsSimple(
    productNames: string[],
  ): ClassificationResult {
    const blacklist = [
      'detergente',
      'sabonete',
      'shampoo',
      'condicionador',
      'papel',
      'toalha',
      'saco',
      'lixo',
      'desinfetante',
      'cloro',
      'álcool',
      'água sanitária',
      'pano',
      'esponja',
      'escova',
      'cerveja',
      'vinho',
      'bebida',
      'chopp',
      'cachaça',
      'vodka',
    ];

    const alimentos: ClassifiedProduct[] = [];
    const rejeitados: ClassifiedProduct[] = [];

    for (const nome of productNames) {
      const lowerName = nome.toLowerCase();
      const isRejected = blacklist.some((word) =>
        lowerName.includes(word),
      );

      const classified: ClassifiedProduct = {
        nome,
        categoria: isRejected ? 'limpeza' : 'alimento',
        confianca: 70,
        motivo: isRejected
          ? 'Contém palavra-chave de produto não-alimento'
          : 'Produto assumido como alimento',
        ingrediente_receita: !isRejected,
      };

      if (isRejected) {
        rejeitados.push(classified);
      } else {
        alimentos.push(classified);
      }
    }

    return {
      produtos_filtrados: [...alimentos, ...rejeitados],
      alimentos_disponiveis: alimentos.map((p) => p.nome),
      rejeitados,
      resumo: {
        total: productNames.length,
        alimentos: alimentos.length,
        rejeitados: rejeitados.length,
      },
    };
  }
}
