import { UnitConverter } from './unit-converter.util';
import { UnidadeMedida } from '@common/enums/unidade-medida.enum';

describe('UnitConverter', () => {
  describe('normalizarPreco', () => {
    describe('Conversões de Peso', () => {
      it('deve converter de gramas para quilogramas corretamente', () => {
        // Comprei 500g de arroz por R$5
        // Esperado: R$10 por kg (5 / 0.5)
        const resultado = UnitConverter.normalizarPreco(
          5,
          500,
          UnidadeMedida.G,
          UnidadeMedida.KG,
        );
        expect(resultado).toBe(10);
      });

      it('deve converter de miligramas para gramas corretamente', () => {
        // Comprei 1000mg de sal por R$2
        // Esperado: R$2 por grama (2 / 1)
        const resultado = UnitConverter.normalizarPreco(
          2,
          1000,
          UnidadeMedida.MG,
          UnidadeMedida.G,
        );
        expect(resultado).toBe(2);
      });

      it('deve converter de miligramas para quilogramas corretamente', () => {
        // Comprei 500000mg de café por R$10
        // Esperado: R$20 por kg (10 / 0.5)
        const resultado = UnitConverter.normalizarPreco(
          10,
          500000,
          UnidadeMedida.MG,
          UnidadeMedida.KG,
        );
        expect(resultado).toBe(20);
      });

      it('deve não fazer conversão quando unidade já é a padrão', () => {
        // Comprei 1kg de feijão por R$5
        // Esperado: R$5 por kg (5 / 1)
        const resultado = UnitConverter.normalizarPreco(
          5,
          1,
          UnidadeMedida.KG,
          UnidadeMedida.KG,
        );
        expect(resultado).toBe(5);
      });
    });

    describe('Conversões de Volume', () => {
      it('deve converter de mililitros para litros corretamente', () => {
        // Comprei 500ml de leite por R$3
        // Esperado: R$6 por litro (3 / 0.5)
        const resultado = UnitConverter.normalizarPreco(
          3,
          500,
          UnidadeMedida.ML,
          UnidadeMedida.L,
        );
        expect(resultado).toBe(6);
      });

      it('deve não fazer conversão quando unidade volume já é a padrão', () => {
        // Comprei 1l de suco por R$4
        // Esperado: R$4 por litro (4 / 1)
        const resultado = UnitConverter.normalizarPreco(
          4,
          1,
          UnidadeMedida.L,
          UnidadeMedida.L,
        );
        expect(resultado).toBe(4);
      });
    });

    describe('Unidades sem conversão', () => {
      it('deve retornar preço unitário para unidades sem conversão', () => {
        // Comprei 3 alhos por R$2
        // Esperado: R$0.67 por alho (2 / 3)
        const resultado = UnitConverter.normalizarPreco(
          2,
          3,
          UnidadeMedida.DENTE,
          UnidadeMedida.DENTE,
        );
        expect(resultado).toBeCloseTo(0.67, 2);
      });

      it('deve calcular preço unitário para unidades (un)', () => {
        // Comprei 6 ovos por R$7
        // Esperado: R$1.17 por ovo (7 / 6)
        const resultado = UnitConverter.normalizarPreco(
          7,
          6,
          UnidadeMedida.UN,
          UnidadeMedida.UN,
        );
        expect(resultado).toBeCloseTo(1.17, 2);
      });

      it('deve calcular preço unitário para pacotes (pct)', () => {
        // Comprei 2 pacotes de biscoito por R$5
        // Esperado: R$2.50 por pacote
        const resultado = UnitConverter.normalizarPreco(
          5,
          2,
          UnidadeMedida.PCT,
          UnidadeMedida.PCT,
        );
        expect(resultado).toBe(2.5);
      });
    });

    describe('Casos extremos', () => {
      it('deve retornar 0 se preço é zero', () => {
        const resultado = UnitConverter.normalizarPreco(
          0,
          1,
          UnidadeMedida.KG,
          UnidadeMedida.KG,
        );
        expect(resultado).toBe(0);
      });

      it('deve retornar 0 se quantidade é zero', () => {
        const resultado = UnitConverter.normalizarPreco(
          5,
          0,
          UnidadeMedida.KG,
          UnidadeMedida.KG,
        );
        expect(resultado).toBe(0);
      });

      it('deve retornar 0 se preço é negativo', () => {
        const resultado = UnitConverter.normalizarPreco(
          -5,
          1,
          UnidadeMedida.KG,
          UnidadeMedida.KG,
        );
        expect(resultado).toBe(0);
      });

      it('deve arredondar resultado para 2 casas decimais', () => {
        // Comprei 333g de produto por R$1.23
        // Esperado: R$3.69 por kg arredondado
        const resultado = UnitConverter.normalizarPreco(
          1.23,
          333,
          UnidadeMedida.G,
          UnidadeMedida.KG,
        );
        expect(resultado).toBe(3.69);
      });
    });

    describe('Erros de conversão', () => {
      it('deve lançar erro ao tentar converter peso para volume', () => {
        expect(() => {
          UnitConverter.normalizarPreco(
            5,
            1,
            UnidadeMedida.KG,
            UnidadeMedida.L,
          );
        }).toThrow('Conversão incompatível entre kg e l');
      });

      it('deve lançar erro ao tentar converter volume para peso', () => {
        expect(() => {
          UnitConverter.normalizarPreco(
            3,
            1,
            UnidadeMedida.L,
            UnidadeMedida.KG,
          );
        }).toThrow('Conversão incompatível entre l e kg');
      });
    });

    describe('Compatibilidade entre unidades', () => {
      it('deve reconhecer kg e g como compatíveis', () => {
        const resultado = UnitConverter.saoCompatíveis(
          UnidadeMedida.KG,
          UnidadeMedida.G,
        );
        expect(resultado).toBe(true);
      });

      it('deve reconhecer ml e l como compatíveis', () => {
        const resultado = UnitConverter.saoCompatíveis(
          UnidadeMedida.ML,
          UnidadeMedida.L,
        );
        expect(resultado).toBe(true);
      });

      it('deve reconhecer un e un como compatíveis', () => {
        const resultado = UnitConverter.saoCompatíveis(
          UnidadeMedida.UN,
          UnidadeMedida.UN,
        );
        expect(resultado).toBe(true);
      });

      it('deve reconhecer kg e l como incompatíveis', () => {
        const resultado = UnitConverter.saoCompatíveis(
          UnidadeMedida.KG,
          UnidadeMedida.L,
        );
        expect(resultado).toBe(false);
      });

      it('deve reconhecer un e kg como incompatíveis', () => {
        const resultado = UnitConverter.saoCompatíveis(
          UnidadeMedida.UN,
          UnidadeMedida.KG,
        );
        expect(resultado).toBe(false);
      });
    });

    describe('Conversões do mundo real', () => {
      it('deve calcular preço de 1kg de carne comprado em porções', () => {
        // Comprei 250g de carne por R$6
        // Quantos 1kg sai? 6 * 4 = R$24
        const resultado = UnitConverter.normalizarPreco(
          6,
          250,
          UnidadeMedida.G,
          UnidadeMedida.KG,
        );
        expect(resultado).toBe(24);
      });

      it('deve calcular preço de 1l de suco comprado em copo', () => {
        // Comprei 200ml de suco por R$1
        // Quantos 1l sai? 1 * 5 = R$5
        const resultado = UnitConverter.normalizarPreco(
          1,
          200,
          UnidadeMedida.ML,
          UnidadeMedida.L,
        );
        expect(resultado).toBe(5);
      });

      it('deve calcular preço unitário de frutas em molho', () => {
        // Comprei um molho de manjericão com 4 folhas por R$1.50
        // Quantos R$ por folha? 1.50 / 4 = R$0.375
        const resultado = UnitConverter.normalizarPreco(
          1.5,
          4,
          UnidadeMedida.FOLHA,
          UnidadeMedida.FOLHA,
        );
        expect(resultado).toBeCloseTo(0.375, 2);
      });
    });
  });
});
