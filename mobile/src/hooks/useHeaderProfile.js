import React from 'react';
import { TouchableOpacity } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { colors } from '../theme/colors';

/**
 * Hook para padronizar o ícone de perfil no header
 * Pode ser usado em qualquer tela que faça parte do tab navigator
 */
export function useHeaderProfile(navigation) {
  return {
    headerRight: () => (
      <TouchableOpacity
        onPress={() => navigation.navigate('Profile')}
        style={{ marginRight: 16, padding: 5 }}
        activeOpacity={0.6}
      >
        <FeatherIcon
          name="user"
          size={20}
          color={colors.text.primary}
        />
      </TouchableOpacity>
    ),
  };
}
