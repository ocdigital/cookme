import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receita } from '../entities/receita.entity';
import { ReceitaIngrediente } from '../entities/receita-ingrediente.entity';
import { Produto } from '../../produtos/entities/produto.entity';
import { DificuldadeReceita } from '../../../common/enums/dificuldade-receita.enum';
import { UnidadeMedida } from '../../../common/enums/unidade-medida.enum';
import { Receita as ReceitaGerada } from './recipe-generator.service';
import { IngredientNormalizerService } from './ingredient-normalizer.service';
import { ReceitaClassificacaoService } from './receita-classificacao.service';

// Ingredients that define a recipe — high weight in matching
const PROTAGONISTAS = new Set([
  // Carnes e proteínas
  'carne', 'frango', 'peixe', 'atum', 'salmao', 'bacalhau', 'camarao',
  'linguica', 'calabresa', 'costela', 'picanha', 'contrafile', 'alcatra',
  'maminha', 'patinho', 'acem', 'paleta', 'perna', 'bisteca', 'file',
  'lombo', 'presunto', 'bacon', 'salsicha', 'mortadela', 'sardinha',
  'peru', 'pato', 'coelho', 'cordeiro', 'vitela', 'porco',
  // Leguminosas protagonistas
  'feijao', 'grao de bico', 'lentilha', 'soja', 'feijoada',
  // Massas
  'macarrao', 'espaguete', 'penne', 'fusilli', 'lasanha', 'nhoque', 'ravioli',
  'farfalle', 'rigatoni', 'tagliatelle',
  // Vegetais protagonistas
  'berinjela', 'abobrinha', 'abobora', 'couve-flor', 'brocolis',
  'mandioca', 'batata', 'batata doce', 'inhame', 'chuchu', 'quiabo',
  'beterraba', 'cenoura', 'tomate', 'milho', 'repolho', 'couve', 'espinafre',
  // Frutas protagonistas (bolos, doces, vitaminas)
  'banana', 'maca', 'pera', 'manga', 'mamao', 'abacaxi', 'laranja', 'limao',
  'morango', 'uva', 'goiaba', 'caju', 'maracuja', 'acerola', 'graviola',
  'caqui', 'ponkan', 'mexerica', 'tangerina', 'melao', 'melancia', 'pessego',
  'damasco', 'figo', 'kiwi', 'framboesa', 'mirtilo', 'ameixa',
  // Frutos do mar
  'lagosta', 'polvo', 'lula', 'ostra', 'mexilhao', 'caranguejo',
  // Laticínios protagonistas
  'queijo', 'requeijao', 'mussarela', 'parmesao', 'ricota',
]);

// Generic support ingredients — low weight (everyone has them or can easily get)
// Exportado para reuso: o aprendizado de perfil ignora auxiliares (não faz sentido
// "aprender" que o usuário gosta de sal/água/óleo).
export const AUXILIARES = new Set([
  // Essenciais de tempero
  'sal', 'agua', 'pimenta', 'pimenta do reino', 'pimenta calabresa', 'pimenta vermelha',
  'tempero', 'tempero pronto', 'sazon', 'knorr', 'maggi', 'caldo', 'caldo de galinha',
  'caldo de carne', 'caldo de legumes',
  // Aromáticos básicos (todo mundo tem)
  'alho', 'cebola', 'cebolinha', 'salsinha', 'cheiro verde', 'coentro',
  // Gorduras básicas
  'azeite', 'oleo', 'oleo de soja', 'manteiga',
  // Ácidos de finalização
  'limao', 'limao siciliano', 'vinagre',
  // Ervas e especiarias comuns
  'orégano', 'oregano', 'manjericao', 'alecrim', 'tomilho', 'louro',
  'colorau', 'colorificio', 'paprica', 'açafrão', 'acafrao', 'curcuma',
  'canela', 'cravo', 'noz moscada', 'cominho',
  // Outros auxiliares
  'fermento', 'bicarbonato', 'amido', 'amido de milho', 'maisena',
  'extrato de tomate', 'molho shoyu', 'shoyu',
]);

// Ingredients whose weight depends on recipe context (recipe name keywords)
const CONTEXTO_SENSIVEL: Record<string, string[]> = {
  'farinha': ['bolo', 'pao', 'biscoito', 'cookie', 'torta', 'massa', 'crepe', 'panqueca', 'quiche', 'broa', 'rosca', 'panetone', 'cupcake', 'muffin', 'waffle', 'pizza', 'empadao'],
  'acucar': ['bolo', 'biscoito', 'doce', 'sobremesa', 'pudim', 'mousse', 'brigadeiro', 'torta', 'cookie', 'cupcake', 'waffle', 'geleia', 'compota', 'calda'],
  'manteiga': ['bolo', 'biscoito', 'cookie', 'torta', 'croissant'],
  'leite': ['bolo', 'pudim', 'mousse', 'vitamina', 'mingau', 'besamel'],
  'oleo': ['bolo', 'fritura', 'frito'],
};

// Categorias culinárias (estilo TudoGostoso) derivadas por protagonista.
// `porNome` casa no nome da receita; `porChave` casa nos ingredientes_chave.
// A ordem do array é a precedência: proteína animal antes de massa antes de doce/salada.
export const CATEGORIAS_CULINARIAS: {
  id: string;
  label: string;
  icon: string;
  porChave?: string[];
  porNome?: string[];
}[] = [
  { id: 'aves', label: 'Aves', icon: 'food-drumstick', porChave: ['frango', 'galinha', 'peru', 'chester', 'ave'] },
  { id: 'carnes', label: 'Carnes', icon: 'food-steak', porChave: ['carne', 'acem', 'bisteca', 'costela', 'patinho', 'picanha', 'bovino', 'porco', 'suina', 'linguica', 'bacon', 'alcatra', 'maminha', 'coxao', 'file'] },
  { id: 'peixes', label: 'Peixes e frutos do mar', icon: 'fish', porChave: ['peixe', 'camarao', 'atum', 'salmao', 'tilapia', 'sardinha', 'lula', 'polvo', 'bacalhau', 'marisco'] },
  { id: 'massas', label: 'Massas', icon: 'pasta', porChave: ['macarrao', 'espaguete', 'massa', 'lasanha', 'nhoque', 'penne', 'talharim', 'ravioli'] },
  { id: 'bolos-tortas', label: 'Bolos e tortas', icon: 'cake-variant', porNome: ['bolo', 'torta', 'pudim', 'mousse', 'brigadeiro', 'cupcake', 'pave'] },
  { id: 'sobremesas', label: 'Sobremesas', icon: 'ice-cream', porNome: ['doce', 'sobremesa', 'creme', 'gelatina', 'sorvete', 'brigadeiro', 'beijinho', 'canjica', 'arroz doce'] },
  { id: 'saladas', label: 'Saladas', icon: 'bowl-mix', porNome: ['salada'] },
];

@Injectable()
export class ReceitaBancoService {
  private readonly logger = new Logger('ReceitaBancoService');

  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(
    @InjectRepository(Receita)
    private readonly receitaRepo: Repository<Receita>,
    @InjectRepository(ReceitaIngrediente)
    private readonly receitaIngredienteRepo: Repository<ReceitaIngrediente>,
    @InjectRepository(Produto)
    private readonly produtoRepo: Repository<Produto>,
    private readonly normalizer: IngredientNormalizerService,
    private readonly classificacao: ReceitaClassificacaoService,
  ) {}

  /**
   * Normaliza ingrediente: lowercase, remove acentos, trim
   */
  normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')  // remove diacríticos (ã→a, é→e, ç→c, etc.)
      .replace(/-/g, ' ')               // "batata-doce" = "batata doce" para matching
      .replace(/\s+/g, ' ')
      .trim();
  }

  normalizarLista(ingredientes: string[]): string[] {
    return [...new Set(ingredientes.map((i) => this.normalizar(i)))].sort();
  }

  /**
   * Extrai chaves normalizadas de ingredientes brutos.
   * Usa IngredientNormalizerService: "2 dentes de alho amassado" → "alho"
   */
  extrairChaves(ingredientes: string[]): string[] {
    return this.normalizer.extrairChaves(ingredientes);
  }

  /**
   * Peso de um ingrediente no contexto de uma receita.
   * Protagonistas (carne, macarrão, feijão…) = 3
   * Base (alho, cebola, tomate…) = 1
   * Auxiliares (sal, água, pimenta…) = 0.3
   * Contexto-sensível (farinha = 3 em bolos/pães, 0.3 em pratos salgados)
   */
  pesoIngrediente(chave: string, receitaNome: string): number {
    const nomeNorm = this.normalizar(receitaNome);

    // Se o ingrediente (mesmo auxiliar) aparece no nome da receita → protagonista
    // Ex: "Molho branco com azeite de oliva" → azeite vira peso 3
    if (nomeNorm.includes(chave) || chave.split(' ').every((w) => w.length > 3 && nomeNorm.includes(w))) {
      return 3;
    }

    // Context-sensitive: check recipe name keywords
    const ctxKeywords = CONTEXTO_SENSIVEL[chave];
    if (ctxKeywords) {
      return ctxKeywords.some((kw) => nomeNorm.includes(kw)) ? 3 : 0.3;
    }

    // Protagonista: exact or substring match against known set
    for (const prot of PROTAGONISTAS) {
      if (chave === prot || chave.includes(prot) || prot.includes(chave)) return 3;
    }

    // Auxiliar: generic support ingredient
    if (AUXILIARES.has(chave)) return 0.3;

    // Default: base ingredient (aromatics, vegetables, etc.)
    return 1;
  }

  /**
   * Maior score entre as chaves de uma receita que casam com um mapa de
   * preferências (valor canônico → score). Match por inclusão mútua, igual ao
   * matching de ingredientes. Retorna 0 se nada casar ou se o mapa está vazio.
   */
  private maiorAfinidade(chaves: string[], prefs: Map<string, number>): number {
    if (prefs.size === 0) return 0;
    let melhor = 0;
    for (const chaveBruta of chaves) {
      const chave = this.normalizar(chaveBruta);
      for (const [valor, score] of prefs) {
        if ((chave.includes(valor) || valor.includes(chave)) && score > melhor) {
          melhor = score;
        }
      }
    }
    return melhor;
  }

  /**
   * Cobertura ponderada de UMA receita contra um inventário já normalizado.
   * Fonte única usada tanto pela listagem quanto pelo detalhe da receita — assim
   * o detalhe nunca fica com cobertura 0 só por a receita ter sido cortada da lista.
   */
  calcularCoberturaReceita(
    receita: Receita,
    normalizados: string[],
  ): { cobertura: number; disponivel: boolean; temProtagonista: boolean; faltando: string[]; protagonistaNomeFaltando: boolean } {
    // Ingredientes "a gosto" (sal, pimenta) não bloqueiam uma receita
    const riList = receita.ingredientes || [];
    const riPorChave = new Map<string, boolean>();
    for (const ri of riList) {
      const p = ri.produto as any;
      const chave = this.normalizar(p?.nome_display || p?.nome || '');
      if (chave) riPorChave.set(chave, ri.a_gosto || p?.sempre_a_gosto || p?.opcional_por_natureza || false);
    }

    // Protagonistas do nome que não estão nas chaves (ex: "Molho branco com azeite")
    const nomeNormalizado = this.normalizar(receita.nome);
    const protagonistasDoNome = [...PROTAGONISTAS].filter(
      (prot) =>
        nomeNormalizado.includes(prot) &&
        !(receita.ingredientes_chave || []).some((c) => c.includes(prot) || prot.includes(c)),
    );
    const chaves = [...(receita.ingredientes_chave || []), ...protagonistasDoNome];
    if (chaves.length === 0) {
      return { cobertura: 0, disponivel: false, temProtagonista: false, faltando: [], protagonistaNomeFaltando: false };
    }

    const chavesBloqueadoras = chaves.filter((c) => {
      const aGosto = riPorChave.get(c);
      if (aGosto !== undefined) return !aGosto;
      return true;
    });
    const chavesParaCalculo = chavesBloqueadoras.length > 0 ? chavesBloqueadoras : chaves;

    let pesoTotal = 0;
    let pesoEncontrado = 0;
    let temProtagonista = false;
    const faltando: string[] = [];

    for (let idx = 0; idx < chavesParaCalculo.length; idx++) {
      const chave = chavesParaCalculo[idx];
      let peso = this.pesoIngrediente(chave, receita.nome);
      if (idx === 0 && !AUXILIARES.has(chave) && peso < 3) peso = 3;
      else if (idx === 1 && !AUXILIARES.has(chave) && peso < 2) peso = 2;

      pesoTotal += peso;
      const presente = normalizados.some((n) => n.includes(chave) || chave.includes(n)) ||
        [...PROTAGONISTAS].some((prot) => chave.includes(prot) && normalizados.some((n) => n.includes(prot)));
      if (presente) {
        pesoEncontrado += peso;
        if (peso >= 3) temProtagonista = true;
      } else {
        faltando.push(chave);
      }
    }

    const cobertura = pesoTotal > 0 ? pesoEncontrado / pesoTotal : 0;
    const nomeNorm = this.normalizar(receita.nome);
    const protagonistaNomeFaltando = [...PROTAGONISTAS].some(
      (prot) => nomeNorm.includes(prot) && faltando.some((f) => f.includes(prot) || prot.includes(f)),
    );

    return { cobertura, disponivel: faltando.length === 0, temProtagonista, faltando, protagonistaNomeFaltando };
  }

  /**
   * Classifica uma receita numa categoria culinária (aves, carnes, bolos…) por
   * protagonista. Retorna o id da primeira categoria que casar (a ordem de
   * CATEGORIAS_CULINARIAS é a precedência), ou null se nenhuma casar.
   */
  classificarCategoria(receita: Pick<Receita, 'nome' | 'ingredientes_chave'>): string | null {
    const nome = this.normalizar(receita.nome || '');
    const chaves = (receita.ingredientes_chave || []).map((c) => this.normalizar(c));
    for (const cat of CATEGORIAS_CULINARIAS) {
      const casaNome = (cat.porNome || []).some((t) => nome.includes(t));
      const casaChave = (cat.porChave || []).some(
        (t) => chaves.some((c) => c.includes(t)) || nome.includes(t),
      );
      if (casaNome || casaChave) return cat.id;
    }
    return null;
  }

  /** Receitas públicas `ok` (banco compartilhado — sem autor, sem url_fonte). */
  private async receitasPublicasOk(): Promise<Receita[]> {
    return this.receitaRepo
      .createQueryBuilder('r')
      .where("r.status_moderacao = 'ok'")
      .andWhere('r.autor_id IS NULL')
      .andWhere('r.url_fonte IS NULL')
      .getMany();
  }

  /**
   * Lista as categorias culinárias com contagem e uma imagem representativa,
   * ocultando as vazias. Usado pelo grid da tela Categorias.
   */
  async listarCategorias(): Promise<
    { id: string; label: string; icon: string; total: number; imagem_url: string | null }[]
  > {
    const receitas = await this.receitasPublicasOk();
    const acc = new Map<string, { total: number; imagem: string | null }>();
    for (const r of receitas) {
      const cat = this.classificarCategoria(r);
      if (!cat) continue;
      const cur = acc.get(cat) ?? { total: 0, imagem: null };
      cur.total++;
      if (!cur.imagem && r.imagem_url) cur.imagem = r.imagem_url;
      acc.set(cat, cur);
    }
    return CATEGORIAS_CULINARIAS.filter((c) => acc.has(c.id)).map((c) => ({
      id: c.id,
      label: c.label,
      icon: c.icon,
      total: acc.get(c.id)!.total,
      imagem_url: acc.get(c.id)!.imagem,
    }));
  }

  /** Receitas de uma categoria, no formato de card (entidadeParaFormato). */
  async receitasPorCategoria(categoriaId: string): Promise<any[]> {
    const receitas = await this.receitasPublicasOk();
    return receitas
      .filter((r) => this.classificarCategoria(r) === categoriaId)
      .map((r) => ({ ...this.entidadeParaFormato(r), id: r.id, avaliacao_media: r.avaliacao_media, vezes_executada: r.vezes_executada }));
  }

  /** Busca textual nas receitas públicas `ok` (nome ou ingrediente), formato de card. */
  async buscarPorTexto(termo: string, limite = 30): Promise<any[]> {
    const q = this.normalizar(termo);
    if (q.length < 2) return [];
    const receitas = await this.receitasPublicasOk();
    return receitas
      .filter((r) => {
        const nome = this.normalizar(r.nome || '');
        if (nome.includes(q)) return true;
        return (r.ingredientes_chave || []).some((c) => this.normalizar(c).includes(q));
      })
      .slice(0, limite)
      .map((r) => ({ ...this.entidadeParaFormato(r), id: r.id, avaliacao_media: r.avaliacao_media, vezes_executada: r.vezes_executada }));
  }

  /**
   * Busca receitas no banco que podem ser feitas com os ingredientes disponíveis.
   * Uma receita é retornada se pelo menos `percentualMinimo`% dos seus ingredientes
   * estão na lista do usuário.
   */
  async buscarPorIngredientes(
    ingredientes: string[],
    percentualMinimo = 0.7,
    limite = 5,
  ): Promise<Receita[]> {
    const normalizados = this.normalizarLista(ingredientes);

    if (normalizados.length === 0) return [];

    // Busca receitas que têm ingredientes_chave preenchidos e status ok.
    // Banco público estrito: url_fonte IS NULL AND autor_id IS NULL — receitas
    // importadas são biblioteca pessoal e NUNCA entram no matching compartilhado
    // (separação jurídica, Lei 9.610/98).
    const receitas = await this.receitaRepo
      .createQueryBuilder('r')
      .where('r.ingredientes_chave IS NOT NULL')
      .andWhere("r.status_moderacao = 'ok'")
      .andWhere("array_length(r.ingredientes_chave, 1) >= 2")
      .andWhere('r.url_fonte IS NULL')
      .andWhere('r.autor_id IS NULL')
      .orderBy('r.vezes_executada', 'DESC')
      .addOrderBy('r.avaliacao_media', 'DESC')
      .limit(200)
      .getMany();

    const candidatas: Array<{ receita: Receita; score: number }> = [];

    for (const receita of receitas) {
      const chaves = receita.ingredientes_chave || [];
      if (chaves.length === 0) continue;

      // Weighted score: protagonistas valem 3×, auxiliares 0.3×
      let pesoTotal = 0;
      let pesoEncontrado = 0;
      for (const chave of chaves) {
        const peso = this.pesoIngrediente(chave, receita.nome);
        pesoTotal += peso;
        if (normalizados.some((n) => n.includes(chave) || chave.includes(n)) ||
            [...PROTAGONISTAS].some((prot) => chave.includes(prot) && normalizados.some((n) => n.includes(prot)))) {
          pesoEncontrado += peso;
        }
      }

      const score = pesoTotal > 0 ? pesoEncontrado / pesoTotal : 0;

      if (score >= percentualMinimo) {
        candidatas.push({ receita, score });
      }
    }

    // Ordena por maior cobertura de ingredientes
    candidatas.sort((a, b) => b.score - a.score);

    this.logger.log(
      `Busca banco: ${ingredientes.length} ingredientes → ${candidatas.length} receitas compatíveis (mín ${percentualMinimo * 100}%)`,
    );

    return candidatas.slice(0, limite).map((c) => c.receita);
  }

  /**
   * Lista todas as receitas do banco com cobertura calculada para os ingredientes do usuário.
   * Retorna todas as receitas (disponíveis e parciais) com status de cobertura.
   */
  async listarDisponiveisParaUsuario(
    ingredientes: string[],
    limite = 50,
    usuarioId?: string,
    preferencias?: { favoritos: Map<string, number>; aversoes: Map<string, number> },
  ): Promise<Array<{
    receita: Receita;
    cobertura: number;
    disponivel: boolean;
    temProtagonista: boolean;
    faltando: string[];
  }>> {
    const normalizados = this.normalizarLista(ingredientes);
    const favoritos = preferencias?.favoritos ?? new Map<string, number>();
    const aversoes = preferencias?.aversoes ?? new Map<string, number>();

    // Receitas do banco público (sem url_fonte, sem autor)
    const receitasPublicas = await this.receitaRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.ingredientes', 'ri')
      .leftJoinAndSelect('ri.produto', 'produto')
      .where('r.ingredientes_chave IS NOT NULL')
      .andWhere("r.status_moderacao = 'ok'")
      .andWhere('r.autor_id IS NULL')
      .andWhere('r.url_fonte IS NULL')
      .andWhere("array_length(r.ingredientes_chave, 1) >= 2")
      .orderBy('r.vezes_executada', 'DESC')
      .addOrderBy('r.avaliacao_media', 'DESC')
      .limit(200)
      .getMany();

    // Receitas importadas pelo próprio usuário — sempre incluídas, cobertura=1 (usuário escolheu importar)
    const receitasUsuario: Receita[] = usuarioId ? await this.receitaRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.ingredientes', 'ri')
      .leftJoinAndSelect('ri.produto', 'produto')
      .where('r.autor_id = :uid', { uid: usuarioId })
      .andWhere("r.status_moderacao = 'ok'")
      .andWhere('r.url_fonte IS NOT NULL')
      .orderBy('r.criado_em', 'DESC')
      .limit(50)
      .getMany() : [];

    // Importadas entram no MESMO cálculo de cobertura das públicas — "importar"
    // é salvar a receita, não garantir que o usuário tem os ingredientes. O
    // conjunto de ids importados dispensa apenas o corte por cobertura mínima
    // (o usuário quer vê-las mesmo faltando itens), NUNCA marca disponivel=true
    // sem o inventário bater.
    const idsImportadas = new Set(receitasUsuario.map((r) => r.id));
    const receitas = [...receitasPublicas, ...receitasUsuario];

    type ItemResultado = { receita: Receita; cobertura: number; disponivel: boolean; temProtagonista: boolean; faltando: string[]; afinidade: number };

    const resultado: ItemResultado[] = receitas
      .map((receita): ItemResultado | null => {
        const importada = idsImportadas.has(receita.id);
        const { cobertura, disponivel, temProtagonista, faltando, protagonistaNomeFaltando } =
          this.calcularCoberturaReceita(receita, normalizados);
        if ((receita.ingredientes_chave || []).length === 0 && faltando.length === 0 && cobertura === 0) {
          // receita sem chaves — não entra na listagem
          return null;
        }

        // Importadas nunca são cortadas (o usuário salvou, quer vê-las) — mas
        // com cobertura e `faltando` REAIS, então disponivel só fica true se
        // o inventário realmente bate.
        if (!importada) {
          if (protagonistaNomeFaltando) return null;
          // Sem protagonista no inventário → exige 50% de cobertura
          // Com protagonista presente → exige 40% mínimo
          const limiteMinimo = temProtagonista ? 0.4 : 0.5;
          if (cobertura < limiteMinimo) return null;
        }

        // Afinidade com o perfil aprendido: +score por ingrediente favorito,
        // −score por aversão (via ingredientes_chave, mesma base do matching).
        const chaves = receita.ingredientes_chave || [];
        const afinidade =
          this.maiorAfinidade(chaves, favoritos) - this.maiorAfinidade(chaves, aversoes);

        return { receita, cobertura, disponivel, temProtagonista, faltando, afinidade };
      })
      .filter((r): r is ItemResultado => r !== null)
      // Ordena: disponíveis > protagonista presente > (cobertura + afinidade do perfil).
      // A afinidade entra como desempate ponderado APÓS os critérios fortes — nunca
      // coloca uma receita indisponível acima de uma disponível.
      .sort((a, b) => {
        if (a.disponivel !== b.disponivel) return a.disponivel ? -1 : 1;
        if (a.temProtagonista !== b.temProtagonista) return a.temProtagonista ? -1 : 1;
        return (b.cobertura + 0.15 * b.afinidade) - (a.cobertura + 0.15 * a.afinidade);
      })
      .slice(0, limite);

    this.logger.log(
      `Listagem: ${ingredientes.length} ingredientes → ${resultado.filter(r => r.disponivel).length} disponíveis, ${resultado.filter(r => !r.disponivel && r.temProtagonista).length} com protagonista, ${resultado.filter(r => !r.disponivel && !r.temProtagonista).length} parciais`,
    );

    return resultado;
  }

  /**
   * Salva uma receita gerada pela IA no banco compartilhado.
   * Evita duplicatas pelo título normalizado.
   */
  async salvarReceitaGerada(receita: ReceitaGerada, proprietarioId?: string): Promise<Receita> {
    const tituloNorm = this.normalizar(receita.titulo);

    // Verifica duplicata pelo título normalizado
    const existente = await this.receitaRepo
      .createQueryBuilder('r')
      .where('LOWER(unaccent(r.nome)) = LOWER(unaccent(:titulo))', { titulo: receita.titulo })
      .getOne()
      .catch(async () => {
        // fallback sem unaccent: busca por título normalizado JS
        const todos = await this.receitaRepo.find({ select: ['id', 'nome'] });
        return todos.find((r) => this.normalizar(r.nome) === tituloNorm) ?? null;
      });

    if (existente) {
      this.logger.log(`Receita "${receita.titulo}" já existe no banco (id: ${existente.id})`);
      return existente;
    }

    const ingredientesChave = this.extrairChaves(receita.ingredientes);
    const tempoMinutos = this.parseTempo(receita.tempo_preparo);

    const modoPreparo = Array.isArray(receita.modo_preparo)
      ? JSON.stringify(receita.modo_preparo)
      : receita.modo_preparo;

    const nova = this.receitaRepo.create({
      nome: receita.titulo,
      descricao: receita.descricao,
      modo_preparo: modoPreparo,
      tempo_preparo: tempoMinutos,
      rendimento_porcoes: this.parseRendimento(receita.rendimento),
      dificuldade: this.normalizarDificuldade(receita.dificuldade),
      imagem_url: receita.imagem_url,
      ingredientes_chave: ingredientesChave,
      // Lista de exibição preservada como veio da IA (texto com quantidade)
      ingredientes_texto: receita.ingredientes?.length ? receita.ingredientes : null,
      origem: (receita as any).url_fonte ? 'internet' : 'ia_gerada',
      url_fonte: (receita as any).url_fonte || null,
      avaliacao_media: (receita as any).avaliacao || 0,
      // Receitas do usuário (importadas) → ok direto; geradas pela IA: score>=70 ok, score<70 em_revisao, null (erro API) em_revisao
      status_moderacao: (proprietarioId || (receita as any).url_fonte) ? 'ok' : (receita.validation_score != null ? (receita.validation_score >= 70 ? 'ok' : 'em_revisao') : 'em_revisao'),
      validation_score: receita.validation_score ?? null,
      validation_issues: receita.validation_issues?.join(' | ') ?? null,
      tags_dieta: this.classificacao.classificarTags(ingredientesChave, receita.tags_dieta || [], receita.titulo) || undefined,
      autor_id: proprietarioId ?? null,
    } as any);

    const salva = (await this.receitaRepo.save(nova as any)) as Receita;

    // Cria links receita_ingredientes: observacao = texto original da IA, produto_id = match do inventário
    const todosProdutos = await this.produtoRepo.find({ where: { ingrediente_receita: true } });
    for (let i = 0; i < receita.ingredientes.length; i++) {
      const textoOriginal = receita.ingredientes[i];
      const produto = this.resolverProduto(textoOriginal, todosProdutos);
      const aGosto = produto ? (produto as any).sempre_a_gosto === true : false;
      const link = this.receitaIngredienteRepo.create({
        receita_id: salva.id,
        produto_id: produto?.id ?? null,
        quantidade: aGosto ? null : 1,
        unidade: aGosto ? UnidadeMedida.A_GOSTO : UnidadeMedida.UN,
        a_gosto: aGosto,
        observacao: textoOriginal,
        ordem: i,
      } as any);
      await this.receitaIngredienteRepo.save(link);
    }

    this.logger.log(`✅ Receita "${receita.titulo}" salva (id: ${salva.id}), ${receita.ingredientes.length} ingredientes linkados`);
    return salva;
  }

  /**
   * Resolve qual produto do banco corresponde ao texto de ingrediente gerado pela IA.
   * Ex: "2 ovos" → Produto "Ovo"; "500g de farinha de trigo" → Produto "Farinha de Trigo"
   */
  private resolverProduto(textoIngrediente: string, produtos: Produto[]): Produto | null {
    const texto = this.normalizar(textoIngrediente);
    // Remove quantidades e unidades do início: "2 ovos" → "ovos", "500g de farinha" → "farinha"
    const semQuantidade = texto
      .replace(/^\d+[\d,./]*\s*/, '')
      .replace(/^(kg|g|ml|l|un|gr|xicara|xcara|colher|colheres|pitada|dente|dentes|fatia|fatias)\s+(de\s+)?/, '')
      .trim();

    let melhor: Produto | null = null;
    let melhorScore = 0;

    for (const produto of produtos) {
      const nomeNorm = this.normalizar(produto.nome_display || produto.nome);
      // Score por inclusão mútua
      const score = semQuantidade.includes(nomeNorm) || nomeNorm.includes(semQuantidade)
        ? nomeNorm.length  // prefere match mais longo/específico
        : semQuantidade.includes(nomeNorm.split(' ')[0]) || nomeNorm.split(' ')[0].includes(semQuantidade.split(' ')[0])
          ? 1
          : 0;
      if (score > melhorScore) {
        melhorScore = score;
        melhor = produto;
      }
    }

    return melhorScore > 0 ? melhor : null;
  }

  /**
   * Retorna os ingredientes no formato para o sheet "Faltando"/"Fiz essa!":
   * nome = nome_display do produto (limpo), produto_id para linkar ao inventário.
   */
  ingredientesParaSheet(receita: Receita): Array<{ nome: string; produto_id: string | null }> {
    if (!receita.ingredientes?.length) return [];
    return receita.ingredientes
      .filter((ri) => {
        // Exclui ingredientes "a gosto" do sheet — ninguém marca sal como esgotado
        if (ri.a_gosto) return false;
        const p = ri.produto as any;
        if (p?.sempre_a_gosto || p?.opcional_por_natureza) return false;
        return true;
      })
      .map((ri) => ({
        nome: (ri.produto as any)?.nome_display || (ri.produto as any)?.nome || ri.observacao || '',
        produto_id: ri.produto_id || null,
      }))
      .filter((i) => i.nome);
  }

  async buscarIngredientesAGosto(): Promise<string[]> {
    const produtos = await this.produtoRepo.find({
      where: { sempre_a_gosto: true, ingrediente_receita: true },
      select: ['nome_display', 'nome'],
    });
    return produtos.map(p => (p as any).nome_display || p.nome);
  }

  /**
   * Busca receita por ID. Se `paraUsuarioId` for informado, aplica a checagem
   * de dono: receita com autor_id (importada/criada por usuário) só é visível
   * ao próprio autor — para terceiros responde 404 (não 403, para não
   * confirmar a existência).
   */
  async buscarPorId(id: string, paraUsuarioId?: string): Promise<Receita> {
    // ID não-UUID (ex: receita gerada na hora com id temporário) nunca existe no
    // banco — responde 404 em vez de deixar o Postgres estourar 500 na query uuid.
    if (!ReceitaBancoService.UUID_REGEX.test(id)) {
      throw new NotFoundException(`Receita ${id} não encontrada`);
    }
    const receita = await this.receitaRepo.findOne({ where: { id } });
    if (!receita) throw new NotFoundException(`Receita ${id} não encontrada`);
    if (
      paraUsuarioId !== undefined &&
      (receita as any).autor_id &&
      (receita as any).autor_id !== paraUsuarioId
    ) {
      throw new NotFoundException(`Receita ${id} não encontrada`);
    }
    return receita;
  }

  async incrementarExecucao(id: string): Promise<void> {
    await this.receitaRepo.increment({ id }, 'vezes_executada', 1);
  }

  async maisExecutada(tagsFiltro?: string[]): Promise<Receita | null> {
    const todas = await this.receitaRepo.find({
      where: { status_moderacao: 'ok' as any },
      order: { vezes_executada: 'DESC' },
      select: ['id', 'nome', 'tags_dieta', 'vezes_executada', 'imagem_url', 'tempo_preparo', 'dificuldade'],
    });

    if (!tagsFiltro?.length) return todas[0] ?? null;

    const filtradas = todas.filter(r => {
      const tags = String(r.tags_dieta || '').toLowerCase();
      return tagsFiltro.some(t => tags.includes(t));
    });
    return filtradas[0] ?? todas[0] ?? null;
  }

  /**
   * Converte receita da entidade para o formato usado pelo mobile
   */
  entidadeParaFormato(receita: Receita): ReceitaGerada {
    // Precedência da lista de exibição:
    // 1. ingredientes_texto — lista curada (fluxo atual e backfill do legado)
    // 2. receita_ingredientes.observacao — texto original por linha (relacional)
    // 3. ingredientes_chave — última opção (normalizada, só palavra-chave)
    const ingredientes: string[] =
      receita.ingredientes_texto && receita.ingredientes_texto.length > 0
        ? receita.ingredientes_texto
        : receita.ingredientes?.length > 0
          ? receita.ingredientes
              .map((ri) => ri.observacao || (ri.produto as any)?.nome_display || (ri.produto as any)?.nome || '')
              .filter(Boolean)
          : receita.ingredientes_chave || [];

    return {
      titulo: receita.nome,
      descricao: receita.descricao || '',
      tempo_preparo: receita.tempo_preparo ? `${receita.tempo_preparo} minutos` : '',
      dificuldade: (receita.dificuldade as any) || 'médio',
      ingredientes,
      modo_preparo: receita.modo_preparo,
      rendimento: `${receita.rendimento_porcoes} porções`,
      imagem_url: receita.imagem_url,
    };
  }

  private normalizarDificuldade(dificuldade: string): DificuldadeReceita {
    const mapa: Record<string, DificuldadeReceita> = {
      'facil': DificuldadeReceita.FACIL,
      'fácil': DificuldadeReceita.FACIL,
      'easy': DificuldadeReceita.FACIL,
      'medio': DificuldadeReceita.MEDIA,
      'médio': DificuldadeReceita.MEDIA,
      'medium': DificuldadeReceita.MEDIA,
      'dificil': DificuldadeReceita.DIFICIL,
      'difícil': DificuldadeReceita.DIFICIL,
      'hard': DificuldadeReceita.DIFICIL,
    };
    return mapa[this.normalizar(dificuldade || 'medio')] ?? DificuldadeReceita.MEDIA;
  }

  private parseTempo(tempo: string): number {
    const match = tempo?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 30;
  }

  private parseRendimento(rendimento: string): number {
    const match = rendimento?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 2;
  }
}
