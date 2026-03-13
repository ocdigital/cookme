import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { colors, spacing } from '../theme/colors';

/**
 * Componente para renderizar header com ícone de perfil
 * Pode incluir um badge/alerta opcional
 *
 * @param {Object} props
 * @param {Function} props.onProfilePress - Callback ao clicar no perfil
 * @param {Function} props.onAlertPress - Callback ao clicar no alerta (opcional)
 * @param {number} props.alertCount - Número para exibir no badge (opcional)
 * @param {string} props.alertColor - Cor do ícone de alerta (opcional)
 */
export function HeaderWithProfile({
  onProfilePress,
  onAlertPress,
  alertCount,
  alertColor = colors.primary,
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginRight: 16 }}>
      {onAlertPress && alertCount > 0 && (
        <TouchableOpacity
          onPress={onAlertPress}
          style={{ position: 'relative', padding: spacing.sm }}
          activeOpacity={0.7}
        >
          <FeatherIcon
            name="alert-circle"
            size={20}
            color={alertColor}
          />
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: '#FF4444',
              borderRadius: 10,
              width: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: colors.background.main,
            }}
          >
            <Text style={{ color: colors.white, fontSize: 11, fontWeight: '700' }}>
              {alertCount}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={onProfilePress}
        style={{ padding: spacing.sm }}
        activeOpacity={0.6}
      >
        <FeatherIcon
          name="user"
          size={20}
          color={colors.text.primary}
        />
      </TouchableOpacity>
    </View>
  );
}
