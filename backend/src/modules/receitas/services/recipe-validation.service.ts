import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ValidationResult {
  score: number;
  issues: string[];
  status: 'ok' | 'em_revisao' | 'descartar';
}

// Ingredientes-protagonistas: receita com esse nome no título DEVE ter o ingrediente na lista
const PROTAGONISTAS: Record<string, string[]> = {
  'lagosta':      ['lagosta'],
  'camarão':      ['camarão', 'camarao'],
  'salmão':       ['salmão', 'salmao'],
  'frango':       ['frango'],
  'carne':        ['carne', 'patinho', 'alcatra', 'maminha', 'picanha', 'acém', 'acem'],
  'peixe':        ['peixe', 'tilápia', 'tilapia', 'atum', 'bacalhau', 'merluza', 'corvina'],
  'abobrinha':    ['abobrinha'],
  'bacon':        ['bacon'],
  'queijo':       ['queijo', 'mussarela', 'parmesão', 'parmesao', 'ricota'],
  'cogumelo':     ['cogumelo', 'champignon', 'shiitake'],
  'berinjela':    ['berinjela'],
  'espinafre':    ['espinafre'],
  'brócolis':     ['brócolis', 'brocolis'],
  'lentilha':     ['lentilha'],
  'grão-de-bico': ['grão-de-bico', 'grao-de-bico', 'grão de bico'],
};

// Palavras absurdas que indicam receita corrompida
const TERMOS_INVALIDOS = [
  'imao para lavar',
  'cafezinho de sal',
  'sobremesa rasa de',
  'colher de sopa de sal de',
  'xícara de açúcar de sal',
];

@Injectable()
export class RecipeValidationService {
  private readonly logger = new Logger('RecipeValidationService');
  private geminiModel: any;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }
  }

  // Validação determinística — rápida, sem IA, bloqueia os casos óbvios
  validarDeterministico(receita: {
    titulo: string;
    ingredientes: string[];
    modo_preparo: string;
  }): { ok: boolean; motivo?: string } {
    const tituloNorm = receita.titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const ingredientesNorm = receita.ingredientes.map(i =>
      i.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    ).join(' ');
    const modoNorm = receita.modo_preparo.toLowerCase();

    // 1. Ingredientes mínimos
    if (receita.ingredientes.length < 2) {
      return { ok: false, motivo: 'Menos de 2 ingredientes' };
    }

    // 2. Modo de preparo mínimo
    if (receita.modo_preparo.trim().length < 50) {
      return { ok: false, motivo: 'Modo de preparo muito curto' };
    }

    // 3. Termos absurdos/corrompidos
    for (const termo of TERMOS_INVALIDOS) {
      if (ingredientesNorm.includes(termo) || modoNorm.includes(termo)) {
        return { ok: false, motivo: `Ingrediente inválido detectado: "${termo}"` };
      }
    }

    // 4. Ingrediente protagonista ausente
    for (const [palavra, sinonimos] of Object.entries(PROTAGONISTAS)) {
      if (tituloNorm.includes(palavra)) {
        const temProtagonista = sinonimos.some(s => ingredientesNorm.includes(s));
        if (!temProtagonista) {
          return { ok: false, motivo: `Receita de ${receita.titulo} sem ingrediente principal (${palavra})` };
        }
        break;
      }
    }

    return { ok: true };
  }

  async validar(receita: {
    titulo: string;
    ingredientes: string[];
    modo_preparo: string;
    tempo_preparo: string | number;
    rendimento: string;
  }): Promise<ValidationResult> {

    // Validação determinística primeiro — bloqueia lixo óbvio sem chamar IA
    const det = this.validarDeterministico(receita);
    if (!det.ok) {
      this.logger.warn(`"${receita.titulo}" bloqueado na validação determinística: ${det.motivo}`);
      return { score: 0, issues: [det.motivo!], status: 'descartar' };
    }

    if (!this.geminiModel) {
      return { score: 75, issues: [], status: 'ok' };
    }

    const prompt = `Você é um chef experiente avaliando uma receita. Analise criticamente e seja rigoroso:

Receita: ${receita.titulo}
Ingredientes: ${receita.ingredientes.slice(0, 15).join(', ')}
Tempo: ${receita.tempo_preparo}
Rendimento: ${receita.rendimento}
Modo de preparo:
${receita.modo_preparo.substring(0, 1000)}

Critérios de avaliação:
- Ingredientes fazem sentido juntos culinariamente? (25 pts)
- O modo de preparo menciona ingredientes que NÃO estão na lista? Se sim, descontar muito (25 pts)
- Quantidades e proporções são realistas? (25 pts)
- Modo de preparo é completo, coerente e executável? (25 pts)

DESCARTE IMEDIATO se:
- Receita tem nome de ingrediente principal mas ele não está na lista
- Ingredientes absurdos ou sem sentido (ex: "cafezinho de sal", medidas incoerentes)
- Modo de preparo pede ingredientes ausentes da lista

Retorne APENAS JSON válido:
{
  "score": 85,
  "issues": ["problema encontrado 1"]
}`;

    try {
      const result = await this.geminiModel.generateContent(prompt);
      const text = result.response.text().trim();
      const json = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(json);

      const score = Math.max(0, Math.min(100, parseInt(parsed.score) || 0));
      const issues: string[] = Array.isArray(parsed.issues) ? parsed.issues : [];

      // Limiar mais alto: só 'ok' acima de 70
      let status: 'ok' | 'em_revisao' | 'descartar';
      if (score >= 70) status = 'ok';
      else if (score >= 50) status = 'em_revisao';
      else status = 'descartar';

      this.logger.debug(`"${receita.titulo}" → score ${score} (${status})`);
      return { score, issues, status };
    } catch (err: any) {
      this.logger.warn(`Falha na validação de "${receita.titulo}": ${err.message}`);
      return { score: 75, issues: [], status: 'ok' };
    }
  }
}
