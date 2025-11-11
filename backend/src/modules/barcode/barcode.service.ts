import { Injectable } from '@nestjs/common';
import { ProdutosService } from '../produtos/produtos.service';

@Injectable()
export class BarcodeService {
  constructor(private readonly produtosService: ProdutosService) {}

  /**
   * Busca produto por código de barras
   * Primeiro verifica no banco local, depois pode integrar APIs externas
   */
  async buscarPorCodigo(codigo: string): Promise<any> {
    // Tenta buscar no banco local
    const produto = await this.produtosService.findByBarcode(codigo);

    if (produto) {
      return {
        encontrado: true,
        origem: 'local',
        produto,
      };
    }

    // TODO: Integrar com Open Food Facts API
    // const produtoExterno = await this.buscarOpenFoodFacts(codigo);

    return {
      encontrado: false,
      origem: 'none',
      mensagem: 'Produto não encontrado. Por favor, cadastre manualmente.',
      codigo,
    };
  }

  /**
   * TODO: Integração com Open Food Facts
   */
  // private async buscarOpenFoodFacts(codigo: string): Promise<any> {
  //   const url = `https://world.openfoodfacts.org/api/v0/product/${codigo}.json`;
  //   // Fazer requisição HTTP
  //   // Mapear resposta para nosso modelo de Produto
  //   // Salvar no banco se encontrado
  // }
}
