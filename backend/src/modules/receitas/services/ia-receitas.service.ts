import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { Receita } from '../entities/receita.entity';
import { Produto } from '../../produtos/entities/produto.entity';
import { ReceitaIngrediente } from '../entities/receita-ingrediente.entity';
import { NotificacaoTriggersService } from '../../notificacoes/services/notificacao-triggers.service';
import { retryWithBackoff, isTransientError } from '../../../common/utils/retry.util';

@Injectable()
export class IAReceitasService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Receita)
    private receitaRepository: Repository<Receita>,
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
    @InjectRepository(ReceitaIngrediente)
    private ingredienteRepository: Repository<ReceitaIngrediente>,
    private notificacaoTriggers: NotificacaoTriggersService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }
  }

  private isRateLimitError(err: any): boolean {
    return isTransientError(err);
  }

  async gerarReceita(ingredientes: string[]): Promise<any> {
    if (!this.model) {
      throw new Error('Gemini API key não configurada');
    }

    const prompt = `Crie uma receita usando estes ingredientes: ${ingredientes.join(', ')}.

Retorne APENAS um JSON válido neste formato:
{
  "nome": "Nome da receita",
  "descricao": "Breve descrição",
  "modo_preparo": "Passo 1\\nPasso 2\\nPasso 3...",
  "tempo_preparo": 30,
  "rendimento_porcoes": 2,
  "dificuldade": "facil",
  "tags_dieta": ["vegetariano"],
  "categoria_receita": "almoco",
  "ingredientes": [
    {"nome": "Arroz", "quantidade": 200, "unidade": "g", "observacao": "2 xícaras"},
    {"nome": "Sal", "quantidade": 5, "unidade": "g", "observacao": "a gosto"}
  ]
}

IMPORTANTE:
- dificuldade: APENAS "facil", "media" ou "dificil"
- categoria_receita: APENAS "cafe-manha", "almoco", "jantar", "lanche" ou "sobremesa"
- unidade: APENAS "kg", "g", "mg", "l", "ml", "un", "pct", "cx", "dente", "folha", "ramo"
- Use observacao para informações adicionais (ex: "2 xícaras", "a gosto")`;

    let result: any;
    try {
      result = await retryWithBackoff(
        () => this.model.generateContent(prompt),
        { maxAttempts: 3, initialDelayMs: 500, shouldRetry: isTransientError },
      );
    } catch (err) {
      if (this.isRateLimitError(err)) {
        this.notificacaoTriggers.limiteIAAtingido('Gemini (Receitas)', 'Cota de requisições esgotada').catch(() => {});
      }
      throw err;
    }
    const text = result.response.text();

    // Extrair JSON do texto
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('IA não retornou JSON válido');
    }

    return JSON.parse(jsonMatch[0]);
  }

  async gerarESalvarReceita(ingredientes: string[]): Promise<Receita> {
    const receitaGerada = await this.gerarReceita(ingredientes);

    // Criar receita
    const receita = this.receitaRepository.create({
      nome: receitaGerada.nome,
      descricao: receitaGerada.descricao,
      modo_preparo: receitaGerada.modo_preparo,
      tempo_preparo: receitaGerada.tempo_preparo,
      rendimento_porcoes: receitaGerada.rendimento_porcoes,
      dificuldade: receitaGerada.dificuldade,
      tags_dieta: receitaGerada.tags_dieta || [],
      tags_preparo: receitaGerada.tags_preparo || [],
      categoria_receita: receitaGerada.categoria_receita,
      origem: 'ia_gerada',
      prompt_ia: `Ingredientes: ${ingredientes.join(', ')}`,
    });

    const savedReceita = await this.receitaRepository.save(receita);

    // Criar ingredientes
    if (receitaGerada.ingredientes && receitaGerada.ingredientes.length > 0) {
      for (let i = 0; i < receitaGerada.ingredientes.length; i++) {
        const ing = receitaGerada.ingredientes[i];

        // Buscar ou criar produto
        let produto = await this.produtoRepository.findOne({
          where: { nome: ing.nome },
        });

        if (!produto) {
          produto = this.produtoRepository.create({
            nome: ing.nome,
            origem: 'ia_gerada',
          });
          produto = await this.produtoRepository.save(produto);
        }

        // Validar unidade
        const validUnits = ['kg', 'g', 'mg', 'l', 'ml', 'un', 'pct', 'cx', 'dente', 'folha', 'ramo'];
        let unidade = ing.unidade;
        let observacao = ing.observacao;

        if (!validUnits.includes(unidade)) {
          observacao = observacao ? `${unidade} - ${observacao}` : unidade;
          unidade = 'un';
        }

        // Criar ingrediente
        const ingrediente = this.ingredienteRepository.create({
          receita_id: savedReceita.id,
          produto_id: produto.id,
          quantidade: ing.quantidade,
          unidade: unidade,
          observacao: observacao,
          ordem: i + 1,
        });

        await this.ingredienteRepository.save(ingrediente);
      }
    }

    // Retornar receita completa
    const receitaCompleta = await this.receitaRepository.findOne({
      where: { id: savedReceita.id },
      relations: ['ingredientes', 'ingredientes.produto'],
    });

    return receitaCompleta || savedReceita;
  }

  async gerarReceitaDoInventario(): Promise<Receita> {
    const produtos = await this.produtoRepository
      .createQueryBuilder('produto')
      .leftJoinAndSelect('produto.categoria', 'categoria')
      .where('categoria.is_food = :isFood', { isFood: true })
      .take(15)
      .getMany();

    if (produtos.length === 0) {
      throw new Error('Nenhum produto alimentício encontrado no banco');
    }

    const ingredientes = produtos.map(p => p.nome);
    return this.gerarESalvarReceita(ingredientes);
  }

  async gerarReceitasSemana(): Promise<Receita[]> {
    const produtos = await this.produtoRepository
      .createQueryBuilder('produto')
      .leftJoinAndSelect('produto.categoria', 'categoria')
      .where('categoria.is_food = :isFood', { isFood: true })
      .take(15)
      .getMany();

    if (produtos.length === 0) {
      throw new Error('Nenhum produto alimentício encontrado no banco');
    }

    const ingredientes = produtos.map(p => p.nome);
    const receitas: Receita[] = [];
    const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    // Gerar 3 receitas por dia (21 total)
    for (let dia = 0; dia < 7; dia++) {
      for (let opcao = 1; opcao <= 3; opcao++) {
        const prompt = `Crie uma receita para ${dias[dia]} (opção ${opcao}) usando: ${ingredientes.join(', ')}.

Retorne APENAS um JSON válido neste formato:
{
  "nome": "Nome da receita",
  "descricao": "Breve descrição",
  "modo_preparo": "Passo 1\\nPasso 2\\nPasso 3...",
  "tempo_preparo": 30,
  "rendimento_porcoes": 2,
  "dificuldade": "facil",
  "tags_dieta": ["vegetariano"],
  "categoria_receita": "almoco",
  "ingredientes": [
    {"nome": "Arroz", "quantidade": 2, "unidade": "un", "observacao": "xícaras"}
  ]
}

IMPORTANTE:
- dificuldade: APENAS "facil", "media" ou "dificil"
- categoria_receita: APENAS "cafe-manha", "almoco", "jantar", "lanche" ou "sobremesa"
- unidade: APENAS "kg", "g", "mg", "l", "ml", "un", "pct", "cx", "dente", "folha", "ramo"
- Use observacao para medidas caseiras (ex: "2 xícaras", "1 colher")`;

        let weekResult: any;
        try {
          weekResult = await this.model.generateContent(prompt);
        } catch (err) {
          if (this.isRateLimitError(err)) {
            this.notificacaoTriggers.limiteIAAtingido('Gemini (Receitas Semana)', 'Cota de requisições esgotada').catch(() => {});
          }
          throw err;
        }
        const text = weekResult.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const receitaGerada = JSON.parse(jsonMatch[0]);
          receitaGerada.nome = `${dias[dia]} - ${receitaGerada.nome}`;

          const receita = await this.salvarReceitaCompleta(receitaGerada, ingredientes);
          receitas.push(receita);
        }
      }
    }

    return receitas;
  }

  private async salvarReceitaCompleta(receitaGerada: any, ingredientesPrompt: string[]): Promise<Receita> {
    const receita = this.receitaRepository.create({
      nome: receitaGerada.nome,
      descricao: receitaGerada.descricao,
      modo_preparo: receitaGerada.modo_preparo,
      tempo_preparo: receitaGerada.tempo_preparo,
      rendimento_porcoes: receitaGerada.rendimento_porcoes,
      dificuldade: receitaGerada.dificuldade,
      tags_dieta: receitaGerada.tags_dieta || [],
      tags_preparo: receitaGerada.tags_preparo || [],
      categoria_receita: receitaGerada.categoria_receita,
      origem: 'ia_gerada',
      prompt_ia: `Ingredientes: ${ingredientesPrompt.join(', ')}`,
    });

    const savedReceita = await this.receitaRepository.save(receita);

    if (receitaGerada.ingredientes && receitaGerada.ingredientes.length > 0) {
      for (let i = 0; i < receitaGerada.ingredientes.length; i++) {
        const ing = receitaGerada.ingredientes[i];

        let produto = await this.produtoRepository.findOne({
          where: { nome: ing.nome },
        });

        if (!produto) {
          produto = this.produtoRepository.create({
            nome: ing.nome,
            origem: 'ia_gerada',
          });
          produto = await this.produtoRepository.save(produto);
        }

        // Validar unidade
        const validUnits = ['kg', 'g', 'mg', 'l', 'ml', 'un', 'pct', 'cx', 'dente', 'folha', 'ramo'];
        let unidade = ing.unidade;
        let observacao = ing.observacao;

        if (!validUnits.includes(unidade)) {
          observacao = observacao ? `${unidade} - ${observacao}` : unidade;
          unidade = 'un';
        }

        const ingrediente = this.ingredienteRepository.create({
          receita_id: savedReceita.id,
          produto_id: produto.id,
          quantidade: ing.quantidade,
          unidade: unidade,
          observacao: observacao,
          ordem: i + 1,
        });

        await this.ingredienteRepository.save(ingrediente);
      }
    }

    return savedReceita;
  }
}
