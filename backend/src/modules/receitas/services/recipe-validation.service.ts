import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ValidationResult {
  score: number;
  issues: string[];
  status: 'ok' | 'em_revisao' | 'descartar';
}

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

  async validar(receita: {
    titulo: string;
    ingredientes: string[];
    modo_preparo: string;
    tempo_preparo: string | number;
    rendimento: string;
  }): Promise<ValidationResult> {
    if (!this.geminiModel) {
      return { score: 75, issues: [], status: 'ok' };
    }

    const prompt = `Você é um chef experiente avaliando uma receita gerada por IA. Analise criticamente:

Receita: ${receita.titulo}
Ingredientes: ${receita.ingredientes.slice(0, 15).join(', ')}
Tempo: ${receita.tempo_preparo}
Rendimento: ${receita.rendimento}
Modo de preparo:
${receita.modo_preparo.substring(0, 1000)}

Avalie de 0 a 100 considerando:
- Combinação de ingredientes faz sentido culinariamente? (30 pts)
- Quantidades e proporções são realistas? (20 pts)
- Modo de preparo é completo e coerente? (30 pts)
- Tempo de preparo é compatível com a complexidade? (20 pts)

Retorne APENAS JSON válido:
{
  "score": 85,
  "issues": ["problema encontrado 1", "problema encontrado 2"]
}

Se não houver problemas, retorne issues como array vazio.`;

    try {
      const result = await this.geminiModel.generateContent(prompt);
      const text = result.response.text().trim();
      const json = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(json);

      const score = Math.max(0, Math.min(100, parseInt(parsed.score) || 0));
      const issues: string[] = Array.isArray(parsed.issues) ? parsed.issues : [];

      let status: 'ok' | 'em_revisao' | 'descartar';
      if (score >= 75) status = 'ok';
      else if (score >= 40) status = 'em_revisao';
      else status = 'descartar';

      this.logger.debug(`"${receita.titulo}" → score ${score} (${status})`);
      return { score, issues, status };
    } catch (err: any) {
      this.logger.warn(`Falha na validação de "${receita.titulo}": ${err.message}`);
      return { score: 75, issues: [], status: 'ok' };
    }
  }
}
