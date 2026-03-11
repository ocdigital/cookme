import { UnidadeMedida } from '@common/enums/unidade-medida.enum';

/**
 * Utilitário para conversão de unidades de medida
 * Normaliza preços para unidade padrão para comparações justas
 */
export class UnitConverter {
  /**
   * Tabelas de conversão para unidade base (kg para peso, l para volume)
   */
  private static readonly WEIGHT_CONVERSIONS: Record<string, number> = {
    [UnidadeMedida.MG]: 0.000001, // 1 mg = 0.000001 kg
    [UnidadeMedida.G]: 0.001,     // 1 g = 0.001 kg
    [UnidadeMedida.KG]: 1,        // 1 kg = 1 kg
  };

  private static readonly VOLUME_CONVERSIONS: Record<string, number> = {
    [UnidadeMedida.ML]: 0.001,    // 1 ml = 0.001 l
    [UnidadeMedida.L]: 1,         // 1 l = 1 l
  };

  private static readonly UNITLESS_UNITS = [
    UnidadeMedida.UN,
    UnidadeMedida.PCT,
    UnidadeMedida.CX,
    UnidadeMedida.DENTE,
    UnidadeMedida.FOLHA,
    UnidadeMedida.RAMO,
  ];

  /**
   * Obtém o fator de conversão para uma unidade
   * Retorna quanto dessa unidade corresponde à unidade base (kg ou l)
   */
  private static getConversionFactor(
    unidade: UnidadeMedida,
  ): number | null {
    if (this.WEIGHT_CONVERSIONS[unidade] !== undefined) {
      return this.WEIGHT_CONVERSIONS[unidade];
    }
    if (this.VOLUME_CONVERSIONS[unidade] !== undefined) {
      return this.VOLUME_CONVERSIONS[unidade];
    }
    // Unidades sem conversão (un, pct, cx, etc)
    return null;
  }

  /**
   * Classifica o tipo de unidade
   */
  private static classifyUnit(
    unidade: UnidadeMedida,
  ): 'weight' | 'volume' | 'unitless' {
    if (this.WEIGHT_CONVERSIONS[unidade] !== undefined) {
      return 'weight';
    }
    if (this.VOLUME_CONVERSIONS[unidade] !== undefined) {
      return 'volume';
    }
    return 'unitless';
  }

  /**
   * Normaliza preço para a unidade padrão do produto
   *
   * Exemplo:
   * - Comprei arroz por R$5 em 500g
   * - Unidade padrão do produto: kg
   * - Resultado: R$10/kg (5 / (500g em kg = 0.5))
   *
   * @param preco - Preço pago pelo item
   * @param quantidade - Quantidade comprada
   * @param unidadeComprada - Unidade em que foi comprado
   * @param unidadePadrao - Unidade padrão para comparação
   * @returns Preço normalizado por unidade padrão
   * @throws Error se unidades não são compatíveis para conversão
   */
  static normalizarPreco(
    preco: number,
    quantidade: number,
    unidadeComprada: UnidadeMedida,
    unidadePadrao: UnidadeMedida,
  ): number {
    // Validar inputs
    if (preco <= 0 || quantidade <= 0) {
      return 0;
    }

    // Classificar unidades
    const tipoComprada = this.classifyUnit(unidadeComprada);
    const tipoPadrao = this.classifyUnit(unidadePadrao);

    // Se unidades não são do mesmo tipo, verificar se podemos converter
    if (tipoComprada !== tipoPadrao) {
      // Se um deles é "unitless", usar conversão especial
      if (tipoComprada === 'unitless' || tipoPadrao === 'unitless') {
        // Para unidades sem conversão, retornar preço unitário direto
        return preco / quantidade;
      }
      // Tipos incompatíveis (não dá para converter volume para peso)
      throw new Error(
        `Conversão incompatível entre ${unidadeComprada} e ${unidadePadrao}`,
      );
    }

    // Conversão para unidades sem conversão (un, pct, etc)
    if (tipoComprada === 'unitless') {
      return preco / quantidade;
    }

    // Obter fatores de conversão
    const fatorComprada = this.getConversionFactor(unidadeComprada);
    const fatorPadrao = this.getConversionFactor(unidadePadrao);

    if (fatorComprada === null || fatorPadrao === null) {
      throw new Error(
        `Não foi possível obter fator de conversão para ${unidadeComprada} ou ${unidadePadrao}`,
      );
    }

    // Converter quantidade para unidade padrão
    // Ex: 500g em kg = 500 * 0.001 = 0.5 kg
    const quantidadeEmUnidadePadrao = quantidade * fatorComprada / fatorPadrao;

    // Calcular preço por unidade padrão
    // Ex: R$5 / 0.5 kg = R$10/kg
    const precoNormalizado = preco / quantidadeEmUnidadePadrao;

    // Arredondar para 2 casas decimais (R$)
    return Math.round(precoNormalizado * 100) / 100;
  }

  /**
   * Verifica se duas unidades são compatíveis para conversão
   */
  static saoCompatíveis(
    unidade1: UnidadeMedida,
    unidade2: UnidadeMedida,
  ): boolean {
    const tipo1 = this.classifyUnit(unidade1);
    const tipo2 = this.classifyUnit(unidade2);

    return tipo1 === tipo2;
  }
}
