import { useState, useEffect } from 'react';
import api from '@/services/api';

export interface PerfilAprendizado {
  ingredientes_favoritos: number;
  gostos_e_aversoes: number;
  ritmo_de_cozinha: number;
  categorias_preferidas: number;
  total_avaliacoes: number;
}

const VAZIO: PerfilAprendizado = {
  ingredientes_favoritos: 0,
  gostos_e_aversoes: 0,
  ritmo_de_cozinha: 0,
  categorias_preferidas: 0,
  total_avaliacoes: 0,
};

export function useCookMeAprendizado() {
  const [perfil, setPerfil] = useState<PerfilAprendizado>(VAZIO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/receitas/perfil-aprendizado')
      .then(r => setPerfil(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const progressoGeral = Math.round(
    (perfil.ingredientes_favoritos +
      perfil.gostos_e_aversoes +
      perfil.ritmo_de_cozinha +
      perfil.categorias_preferidas) / 4,
  );

  return { perfil, loading, progressoGeral };
}
