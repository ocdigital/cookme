import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import api from './api';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth2 Client ID (você precisa configurar isso no console do Google Cloud)
const GOOGLE_CLIENT_ID = '845937856175-6hc9p8j5b5m8c8h8c8h8c8h8c8h8c8h8.apps.googleusercontent.com';

export const googleAuthService = {
  // Inicializar o Google Sign In
  useGoogleSignIn() {
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
      clientId: GOOGLE_CLIENT_ID,
    });

    return { request, response, promptAsync };
  },

  // Processar resposta de autenticação do Google
  async handleGoogleResponse(response) {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      
      try {
        // Enviar token para o backend para criação/atualização de usuário
        const backendResponse = await api.post('/auth/google-login', {
          idToken: id_token,
        });

        const { access_token, refresh_token, user } = backendResponse.data;

        // Armazenar tokens
        await api.interceptors.request.handlers[0](access_token);

        return {
          success: true,
          user,
          access_token,
          refresh_token,
        };
      } catch (error) {
        console.error('Erro ao fazer login com Google:', error);
        return {
          success: false,
          error: error.response?.data?.message || 'Erro ao fazer login com Google',
        };
      }
    }

    return {
      success: false,
      error: 'Login com Google cancelado',
    };
  },
};
