import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import axios from 'axios';
import { PROTAGONISTAS } from './protagonistas';

export interface ValidationResult {
  score: number | null;
  issues: string[];
  status: 'ok' | 'em_revisao' | 'descartar';
}

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
  private geminiApiKey: string | null = null;
  private groq: Groq | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('CLAUDE_API_KEY') ||
                   this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || null;
    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    if (groqKey) {
      this.groq = new Groq({ apiKey: groqKey });
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

    const ing = receita.ingredientes.slice(0, 10).join(', ');
    const preparo = receita.modo_preparo.substring(0, 400);
    const prompt = `Chef avaliando receita. JSON apenas: {"score":0-100,"issues":["..."]}

"${receita.titulo}" | ${receita.tempo_preparo} | ${receita.rendimento}
Ingredientes: ${ing}
Preparo: ${preparo}

Score: ingredientes coerentes(25) + preparo só usa ingredientes listados(25) + proporções realistas(25) + preparo executável(25).
Score 0 se: protagonista ausente nos ingredientes, preparo pede ingrediente não listado, <2 ingredientes.`;

    // Haiku
    if (this.anthropic) {
      try {
        const msg = await this.anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
        });
        return this.parseValidationResponse((msg.content[0] as any).text, receita.titulo);
      } catch (err: any) {
        this.logger.warn(`Haiku falhou na validação de "${receita.titulo}" (${err.status ?? err.message}) — tentando Gemini...`);
      }
    }

    // Fallback: Gemini Flash
    if (this.geminiApiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
        const res = await axios.post(url, {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 600 },
        }, { timeout: 15000 });
        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) return this.parseValidationResponse(text, receita.titulo);
      } catch (err: any) {
        this.logger.warn(`Gemini falhou na validação de "${receita.titulo}": ${err.message}`);
      }
    }

    // Fallback: Groq (Llama 3.3 70B) — gratuito
    if (this.groq) {
      try {
        this.logger.log(`⚡ Validando "${receita.titulo}" com Groq...`);
        const resp = await this.groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 200,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'Você avalia receitas. Responda APENAS JSON: {"score":0-100,"issues":[]}' },
            { role: 'user', content: prompt },
          ],
        });
        const raw = resp.choices[0]?.message?.content ?? '{}';
        return this.parseValidationResponse(raw, receita.titulo);
      } catch (err: any) {
        this.logger.warn(`Groq falhou na validação de "${receita.titulo}": ${err.message}`);
      }
    }

    if (!this.anthropic && !this.geminiApiKey && !this.groq) {
      return { score: null, issues: ['haiku_indisponivel'], status: 'em_revisao' };
    }

    return { score: null, issues: ['erro_api_haiku'], status: 'em_revisao' };
  }

  private parseValidationResponse(text: string, titulo: string): ValidationResult {
    const json = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(json);

    const score = Math.max(0, Math.min(100, parseInt(parsed.score) || 0));
    const issues: string[] = Array.isArray(parsed.issues) ? parsed.issues : [];

    let status: 'ok' | 'em_revisao' | 'descartar';
    if (score >= 70) status = 'ok';
    else if (score >= 50) status = 'em_revisao';
    else status = 'descartar';

    this.logger.debug(`"${titulo}" → score ${score} (${status})`);
    return { score, issues, status };
  }
}
