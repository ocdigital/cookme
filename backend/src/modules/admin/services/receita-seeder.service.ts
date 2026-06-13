import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ReceitaBancoService } from '../../receitas/services/receita-banco.service';
import { Receita as ReceitaEntity } from '../../receitas/entities/receita.entity';
import { Receita } from '../../receitas/services/recipe-generator.service';

function sanitizeStrings(val: unknown): unknown {
  if (typeof val === 'string') return val.replace(/\x00/g, '').normalize('NFC');
  if (Array.isArray(val)) return val.map(sanitizeStrings);
  if (val && typeof val === 'object') {
    return Object.fromEntries(Object.entries(val as Record<string, unknown>).map(([k, v]) => [k, sanitizeStrings(v)]));
  }
  return val;
}

const TEMAS: Array<{ label: string; ingredientes: string[] }> = [
  { label: 'Frango grelhado', ingredientes: ['frango', 'alho', 'limão', 'azeite', 'páprica', 'sal', 'pimenta'] },
  { label: 'Carne moída', ingredientes: ['carne moída', 'tomate', 'cebola', 'alho', 'batata', 'sal', 'óleo'] },
  { label: 'Peixe e frutos do mar', ingredientes: ['filé de peixe', 'limão', 'coentro', 'alho', 'azeite', 'sal', 'pimenta'] },
  { label: 'Macarrão e massas', ingredientes: ['macarrão', 'tomate', 'cebola', 'alho', 'azeite', 'parmesão', 'manjericão'] },
  { label: 'Arroz temperado', ingredientes: ['arroz', 'milho', 'ervilha', 'cenoura', 'cebola', 'alho', 'sal'] },
  { label: 'Feijão e leguminosas', ingredientes: ['feijão preto', 'linguiça', 'alho', 'cebola', 'louro', 'sal', 'óleo'] },
  { label: 'Ovos e café da manhã', ingredientes: ['ovo', 'leite', 'manteiga', 'pão', 'queijo', 'presunto', 'sal'] },
  { label: 'Sopas e caldos', ingredientes: ['abóbora', 'batata doce', 'cebola', 'alho', 'gengibre', 'leite de coco', 'sal'] },
  { label: 'Bolos e tortas doces', ingredientes: ['farinha de trigo', 'açúcar', 'ovo', 'manteiga', 'leite', 'fermento', 'baunilha'] },
  { label: 'Vegetariano e vegano', ingredientes: ['brócolis', 'cenoura', 'chuchu', 'cebola', 'alho', 'azeite', 'sal'] },
  { label: 'Saladas e bowls', ingredientes: ['alface', 'tomate', 'pepino', 'cebola roxa', 'azeite', 'limão', 'sal'] },
  { label: 'Costela e churrasco', ingredientes: ['costela', 'alho', 'sal grosso', 'limão', 'pimenta', 'chimichurri'] },
  { label: 'Frutos do mar', ingredientes: ['camarão', 'alho', 'manteiga', 'limão', 'coentro', 'azeite', 'sal'] },
  { label: 'Tortas e quiches salgadas', ingredientes: ['massa podre', 'ovo', 'requeijão', 'frango', 'creme de leite', 'sal', 'queijo'] },
  { label: 'Panquecas e crepes', ingredientes: ['farinha de trigo', 'ovo', 'leite', 'manteiga', 'sal', 'queijo', 'presunto'] },
  { label: 'Risoto', ingredientes: ['arroz arbóreo', 'vinho branco', 'caldo de frango', 'parmesão', 'cebola', 'manteiga', 'sal'] },
  { label: 'Pão e assados', ingredientes: ['farinha de trigo', 'fermento biológico', 'leite', 'manteiga', 'açúcar', 'sal'] },
  { label: 'Strogonoff', ingredientes: ['frango', 'creme de leite', 'champignon', 'ketchup', 'mostarda', 'cebola', 'sal'] },
  { label: 'Feijoada e carnes cozidas', ingredientes: ['feijão preto', 'costelinha', 'paio', 'linguiça', 'alho', 'cebola', 'louro'] },
  { label: 'Doces e sobremesas', ingredientes: ['chocolate', 'creme de leite', 'açúcar', 'ovo', 'manteiga', 'baunilha', 'leite'] },
  { label: 'Vitaminas e smoothies', ingredientes: ['banana', 'morango', 'leite', 'aveia', 'mel', 'iogurte', 'granola'] },
  { label: 'Frango assado inteiro', ingredientes: ['frango inteiro', 'alho', 'limão', 'manteiga', 'ervas', 'sal', 'pimenta'] },
  { label: 'Pipoca e petiscos', ingredientes: ['milho de pipoca', 'óleo', 'manteiga', 'sal', 'queijo em pó', 'pimenta'] },
  { label: 'Moqueca', ingredientes: ['peixe', 'leite de coco', 'dendê', 'tomate', 'cebola', 'coentro', 'pimenta'] },
  { label: 'Tapioca e crepioca', ingredientes: ['goma de tapioca', 'queijo', 'presunto', 'ovo', 'banana', 'mel'] },
  { label: 'Pizza caseira', ingredientes: ['farinha de trigo', 'mussarela', 'molho de tomate', 'presunto', 'fermento', 'azeite', 'sal'] },
  { label: 'Hambúrguer artesanal', ingredientes: ['carne moída', 'pão de hambúrguer', 'queijo', 'cebola', 'alface', 'tomate', 'sal'] },
  { label: 'Sushi e culinária oriental', ingredientes: ['arroz japonês', 'salmão', 'atum', 'nori', 'vinagre de arroz', 'cream cheese', 'gergelim'] },
  { label: 'Caldinho e sopas rápidas', ingredientes: ['feijão', 'linguiça', 'couve', 'tomate', 'alho', 'cebola', 'sal'] },
  { label: 'Nhoque e gnocchi', ingredientes: ['batata', 'farinha de trigo', 'ovo', 'parmesão', 'manteiga', 'sal', 'molho'] },
];

@Injectable()
export class ReceitaSeederService {
  private readonly logger = new Logger('ReceitaSeederService');

  constructor(
    @InjectRepository(ReceitaEntity)
    private readonly receitaRepo: Repository<ReceitaEntity>,
    private readonly receitaBancoService: ReceitaBancoService,
    private readonly configService: ConfigService,
  ) {}

  async seedarReceitas(opts: { tema?: string; receitasPorTema?: number } = {}): Promise<{
    salvas: number;
    puladas: number;
    erros: number;
    total: number;
  }> {
    const receitasPorTema = opts.receitasPorTema ?? 5;
    const temas = opts.tema
      ? TEMAS.filter((t) => t.label.toLowerCase().includes(opts.tema!.toLowerCase()))
      : TEMAS;

    const countBefore = await this.receitaRepo.count();
    let processadas = 0;
    let erros = 0;

    for (const tema of temas) {
      this.logger.log(`🍳 Gerando receitas para tema: ${tema.label}`);
      try {
        const receitas = await this.chamarGemini(tema.ingredientes, receitasPorTema);
        for (const r of receitas) {
          try {
            await this.receitaBancoService.salvarReceitaGerada(r as Receita);
            processadas++;
          } catch (err: any) {
            this.logger.error(`Erro ao salvar "${r.titulo}": ${err.message}`);
            erros++;
          }
        }
      } catch (err: any) {
        const status = err?.response?.status ?? err?.status;
        if (status === 429) {
          this.logger.warn(`Limite de requisições Gemini atingido após ${processadas} receitas. Encerrando.`);
          break;
        }
        this.logger.error(`Erro no tema "${tema.label}": ${err.message}`);
        erros++;
      }
      await new Promise((r) => setTimeout(r, 1200));
    }

    const countAfter = await this.receitaRepo.count();
    const salvas = countAfter - countBefore;
    const puladas = processadas - salvas;

    this.logger.log(`✅ Seed concluído: ${salvas} salvas, ${puladas} puladas, ${erros} erros`);
    return { salvas, puladas, erros, total: countAfter };
  }

  private async chamarGemini(ingredientes: string[], quantidade: number): Promise<any[]> {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!geminiKey) throw new Error('GEMINI_API_KEY não configurada');

    const prompt = `Você é um chef brasileiro experiente.

Dado estes ingredientes: ${ingredientes.join(', ')}

Gere ${quantidade} receitas brasileiras variadas e criativas usando ALGUNS destes ingredientes.
Misture dificuldades (fácil, médio, difícil) e tempos variados.
Use nomes de ingredientes simples e canônicos (ex: "frango", "tomate", "alho", "ovo").

Retorne APENAS um JSON array válido (sem markdown, sem texto extra):
[
  {
    "titulo": "Nome da Receita",
    "descricao": "Uma frase descritiva",
    "tempo_preparo": "30 minutos",
    "dificuldade": "fácil",
    "ingredientes": ["2 peitos de frango", "3 dentes de alho picados", "1 limão"],
    "modo_preparo": "Passo 1. ...\\nPasso 2. ...\\nPasso 3. ...",
    "rendimento": "4 porções"
  }
]`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { timeout: 45000, responseType: 'arraybuffer' },
    );

    // Decode bytes explicitly as UTF-8 — avoids Latin-1 misinterpretation of accented chars
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(Buffer.from(response.data));
    const json = JSON.parse(decoded);

    let text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) text = jsonMatch[1];

    const parsed = JSON.parse(text.trim());
    const recipes = Array.isArray(parsed) ? parsed : [parsed];
    // Sanitize: remove null bytes PostgreSQL rejects in text columns
    return recipes.map((r: any) => sanitizeStrings(r));
  }
}
