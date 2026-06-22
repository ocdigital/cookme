import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface ValidationResult {
  score: number | null;
  issues: string[];
  status: 'ok' | 'em_revisao' | 'descartar';
}

const PROTAGONISTAS: Record<string, string[]> = {
  'lagosta':        ['lagosta'],
  'camarao':        ['camarao', 'camarão'],
  'salmao':         ['salmao', 'salmão'],
  'atum':           ['atum'],
  'bacalhau':       ['bacalhau'],
  'sardinha':       ['sardinha'],
  'tilapia':        ['tilapia', 'tilápia'],
  'corvina':        ['corvina'],
  'merluza':        ['merluza'],
  'frango':         ['frango', 'peito de frango', 'coxa', 'sobrecoxa', 'file de frango'],
  'carne':          ['carne', 'patinho', 'alcatra', 'maminha', 'picanha', 'acem', 'musculo', 'contrafile', 'bife'],
  'porco':          ['porco', 'suino', 'lombo', 'pernil', 'costelinha', 'bacon', 'linguica'],
  'peixe':          ['peixe', 'tilapia', 'atum', 'bacalhau', 'merluza', 'corvina', 'sardinha'],
  'costela':        ['costela'],
  'linguica':       ['linguica', 'calabresa', 'paio', 'linguiça'],
  'bacon':          ['bacon'],
  'ovo':            ['ovo', 'ovos'],
  'camaroes':       ['camarao', 'camarão'],
  'queijo':         ['queijo', 'mussarela', 'parmesao', 'ricota', 'cottage', 'provolone', 'gruyere', 'brie'],
  'requeijao':      ['requeijao', 'requeijão'],
  'ricota':         ['ricota'],
  'mussarela':      ['mussarela', 'mozarela', 'mozzarella'],
  'abobrinha':      ['abobrinha'],
  'berinjela':      ['berinjela'],
  'brocolis':       ['brocolis', 'brócolis'],
  'espinafre':      ['espinafre'],
  'cogumelo':       ['cogumelo', 'champignon', 'shiitake', 'shimeji', 'portobello'],
  'abobora':        ['abobora', 'abóbora', 'jerimum', 'moranga'],
  'couve':          ['couve'],
  'couve-flor':     ['couve-flor', 'couve flor'],
  'cenoura':        ['cenoura'],
  'batata':         ['batata', 'batata-doce', 'batata doce'],
  'mandioca':       ['mandioca', 'aipim', 'macaxeira'],
  'lentilha':       ['lentilha'],
  'grao-de-bico':   ['grao-de-bico', 'grao de bico', 'grão-de-bico'],
  'feijao':         ['feijao', 'feijão'],
  'quiabo':         ['quiabo'],
  'milho':          ['milho'],
  'palmito':        ['palmito'],
  'alcachofra':     ['alcachofra'],
  'macarrao':       ['macarrao', 'espaguete', 'penne', 'fusilli', 'fettuccine', 'lasanha'],
  'arroz':          ['arroz'],
  'quinoa':         ['quinoa'],
  'tapioca':        ['tapioca'],
  'chocolate':      ['chocolate'],
  'morango':        ['morango'],
  'limao':          ['limao', 'limão'],
  'abacaxi':        ['abacaxi'],
  'coco':           ['coco', 'leite de coco'],
  'banana':         ['banana'],
  'manga':          ['manga'],
  'fricasse':       ['frango', 'creme de leite', 'requeijao'],
  'feijoada':       ['feijao', 'feijão', 'feijao preto', 'carne seca', 'linguica'],
  'lasanha':        ['massa', 'molho', 'mussarela'],
  'coxinha':        ['frango', 'massa', 'farinha'],
};

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
  private anthropic: Anthropic | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('CLAUDE_API_KEY') ||
                   this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

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

    if (receita.ingredientes.length < 2) {
      return { ok: false, motivo: 'Menos de 2 ingredientes' };
    }

    if (receita.modo_preparo.trim().length < 50) {
      return { ok: false, motivo: 'Modo de preparo muito curto' };
    }

    for (const termo of TERMOS_INVALIDOS) {
      if (ingredientesNorm.includes(termo) || modoNorm.includes(termo)) {
        return { ok: false, motivo: `Ingrediente inválido detectado: "${termo}"` };
      }
    }

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

    const det = this.validarDeterministico(receita);
    if (!det.ok) {
      this.logger.warn(`"${receita.titulo}" bloqueado na validação determinística: ${det.motivo}`);
      return { score: 0, issues: [det.motivo!], status: 'descartar' };
    }

    if (!this.anthropic) {
      return { score: null, issues: ['haiku_indisponivel'], status: 'em_revisao' };
    }

    const prompt = `Você é um chef experiente avaliando uma receita brasileira. Analise criticamente e seja rigoroso:

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
- Ingredientes absurdos ou sem sentido
- Modo de preparo pede ingredientes ausentes da lista

Retorne APENAS JSON válido:
{
  "score": 85,
  "issues": ["problema encontrado 1"]
}`;

    try {
      const msg = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = (msg.content[0] as any).text.trim();
      const json = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(json);

      const score = Math.max(0, Math.min(100, parseInt(parsed.score) || 0));
      const issues: string[] = Array.isArray(parsed.issues) ? parsed.issues : [];

      let status: 'ok' | 'em_revisao' | 'descartar';
      if (score >= 70) status = 'ok';
      else if (score >= 50) status = 'em_revisao';
      else status = 'descartar';

      this.logger.debug(`"${receita.titulo}" → score ${score} (${status})`);
      return { score, issues, status };
    } catch (err: any) {
      this.logger.warn(`Falha na validação de "${receita.titulo}": ${err.message}`);
      return { score: null, issues: ['erro_api_haiku'], status: 'em_revisao' };
    }
  }
}
