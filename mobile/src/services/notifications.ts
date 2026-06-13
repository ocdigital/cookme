import api from './api';

// Push notifications: reativar após gerar development build
// projectId: 61ac85de-0558-4d36-90f7-62201c204b47 (já configurado no app.json)

export async function inicializarNotificacoes(): Promise<void> {
  // no-op até ter development build
}

export async function salvarTokenNoBackend(token: string): Promise<void> {
  try {
    await api.patch('/usuarios/push-token', { token });
  } catch {
    // silencioso
  }
}
