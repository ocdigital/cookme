import api from './api';
import { Receita } from './recipe-generator.service';

export interface PlanejamentoItem {
  id: string;
  usuario_id: string;
  numero_semana: number;
  dia_semana: number;
  tipo_refeicao: 'almoco' | 'jantar';
  receita_id: string | null;
  receita: Receita | null;
  feita: boolean;
  avaliacao: number | null;
}

export interface SemanaResponse {
  semana: number;
  items: PlanejamentoItem[];
}

export interface ReceitaDoDia {
  item: PlanejamentoItem | null;
}

class PlanejamentoService {
  async listarSemana(semana: number): Promise<SemanaResponse> {
    const res = await api.get<SemanaResponse>(`/planejamento/semana/${semana}`);
    return res.data;
  }

  async receitaDoDia(): Promise<ReceitaDoDia> {
    const res = await api.get<ReceitaDoDia>('/planejamento/hoje');
    return res.data;
  }

  async definirReceita(
    semana: number,
    dia: number,
    tipo: 'almoco' | 'jantar',
    receitaId: string | null,
  ): Promise<PlanejamentoItem> {
    const res = await api.post<PlanejamentoItem>(
      `/planejamento/semana/${semana}/dia/${dia}/${tipo}`,
      { receita_id: receitaId },
    );
    return res.data;
  }

  async gerarAleatoria(semana: number, apenasRegional = false): Promise<SemanaResponse> {
    const res = await api.post<SemanaResponse>(`/planejamento/semana/${semana}/aleatorio`, {
      apenas_regional: apenasRegional,
    });
    return res.data;
  }

  async marcarFeita(id: string, avaliacao?: number): Promise<PlanejamentoItem> {
    const res = await api.post<PlanejamentoItem>(`/planejamento/${id}/feita`, { avaliacao });
    return res.data;
  }

  async limparDia(semana: number, dia: number, tipo?: 'almoco' | 'jantar'): Promise<void> {
    const params = tipo ? `?tipo=${tipo}` : '';
    await api.delete(`/planejamento/semana/${semana}/dia/${dia}${params}`);
  }
}

export default new PlanejamentoService();
