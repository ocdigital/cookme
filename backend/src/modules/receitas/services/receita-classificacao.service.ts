import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receita } from '../entities/receita.entity';

// Ingredientes que indicam carne/peixe/frutos do mar (não vegetariano, não vegano)
const CARNES = new Set([
  'frango', 'frango grelhado', 'frango assado', 'peito frango', 'coxa frango', 'sobrecoxa',
  'carne', 'carne bovina', 'carne moida', 'carne suina', 'carne seca', 'carne de sol',
  'bife', 'picanha', 'alcatra', 'contrafile', 'file mignon', 'costela', 'maminha', 'patinho',
  'porco', 'lombo', 'pernil', 'leitao', 'pancetta', 'bisteca',
  'bacon', 'linguica', 'salsicha', 'presunto', 'mortadela', 'salame', 'copa', 'pepperoni',
  'peixe', 'salmao', 'atum', 'tilapia', 'tambaqui', 'pirarucu', 'merluza', 'bacalhau',
  'sardinha', 'anchova', 'anchova', 'cavalinha',
  'camarao', 'lagosta', 'caranguejo', 'siri', 'lula', 'polvo', 'marisco', 'mexilhao', 'ostra',
  'frutos do mar', 'mariscos',
  'peru', 'pato', 'coelho', 'cordeiro', 'carneiro', 'cabrito',
  'hamburguer', 'coxinha', 'pernil defumado',
]);

// Produtos de origem animal (não vegano, mas ok para vegetariano)
const NAO_VEGANO = new Set([
  'leite', 'leite condensado', 'leite coco', 'leite integral', 'leite desnatado',
  'queijo', 'queijo minas', 'queijo mussarela', 'queijo parmesao', 'queijo coalho',
  'queijo cottage', 'queijo ricota', 'requeijao', 'mussarela', 'parmesao', 'ricota', 'cottage',
  'ovo', 'ovos', 'clara', 'gema',
  'manteiga', 'ghee',
  'creme leite', 'nata', 'chantilly',
  'iogurte', 'iogurte grego',
  'mel',
  'whey', 'proteina soro leite',
]);

// Tags de fitness detectadas por nome/ingredientes
const FITNESS_TITULOS = [
  'fitness', 'fit', 'proteico', 'low carb', 'low-carb', 'hiperproteico', 'sem gluten', 'integral',
];
const FITNESS_INGREDIENTES = ['aveia', 'quinoa', 'chia', 'linhaca', 'whey', 'proteina'];

function normalizar(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function contemAlgum(lista: string[], conjunto: Set<string>): boolean {
  return lista.some(item => {
    const norm = normalizar(item);
    // verifica match exato ou se o conjunto contém substring do item
    if (conjunto.has(norm)) return true;
    // verifica se algum elemento do conjunto está contido no item normalizado
    for (const kw of conjunto) {
      if (norm.includes(kw) || kw.includes(norm.split(' ')[0])) return true;
    }
    return false;
  });
}

@Injectable()
export class ReceitaClassificacaoService {
  private readonly logger = new Logger(ReceitaClassificacaoService.name);

  constructor(
    @InjectRepository(Receita)
    private readonly receitaRepo: Repository<Receita>,
  ) {}

  classificarTags(
    ingredientesChave: string[],
    tagsDietaAtual: string[],
    nomeReceita = '',
  ): string[] {
    const tags = new Set<string>();
    const ingredNorm = (ingredientesChave || []).map(normalizar);

    const temCarne = contemAlgum(ingredNorm, CARNES);
    const temProdutoAnimal = contemAlgum(ingredNorm, NAO_VEGANO);

    if (!temCarne && !temProdutoAnimal) {
      tags.add('vegano');
      tags.add('vegetariano');
    } else if (!temCarne && temProdutoAnimal) {
      tags.add('vegetariano');
    }
    // temCarne → sem tags vegetariano/vegano (receita normal)

    // Mantém tag fitness se veio da scraping fitness ou se detectado por nome/ingredientes
    const tagsFitness = (tagsDietaAtual || []).some(t => t === 'fitness' || t === 'fit');
    const nomeFitness = FITNESS_TITULOS.some(kw => normalizar(nomeReceita).includes(kw));
    const ingredFitness = FITNESS_INGREDIENTES.some(kw => ingredNorm.some(i => i.includes(kw)));
    if (tagsFitness || nomeFitness || ingredFitness) {
      tags.add('fitness');
    }

    return Array.from(tags);
  }

  async reclassificarTodas(): Promise<{ total: number; atualizadas: number; porTag: Record<string, number> }> {
    const receitas = await this.receitaRepo.find({
      select: ['id', 'nome', 'ingredientes_chave', 'tags_dieta'],
    });

    this.logger.log(`Reclassificando ${receitas.length} receitas...`);

    const porTag: Record<string, number> = { vegano: 0, vegetariano: 0, fitness: 0, normal: 0 };
    let atualizadas = 0;

    for (const receita of receitas) {
      const novasTags = this.classificarTags(
        receita.ingredientes_chave || [],
        receita.tags_dieta || [],
        receita.nome,
      );

      const tagsAtuais = (receita.tags_dieta || []).slice().sort().join(',');
      const tagsNovas = novasTags.slice().sort().join(',');

      if (tagsAtuais !== tagsNovas) {
        await this.receitaRepo.update(receita.id, { tags_dieta: novasTags.length ? novasTags : (null as any) });
        atualizadas++;
      }

      if (novasTags.includes('vegano')) porTag.vegano++;
      else if (novasTags.includes('vegetariano')) porTag.vegetariano++;
      else if (novasTags.includes('fitness')) porTag.fitness++;
      else porTag.normal++;
    }

    this.logger.log(`✅ Reclassificação concluída: ${atualizadas} atualizadas`);
    return { total: receitas.length, atualizadas, porTag };
  }
}
