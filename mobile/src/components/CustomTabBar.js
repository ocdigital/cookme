import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';

export function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  const renderIcon = (routeName, focused) => {
    let iconName = 'home';
    let iconSize = 24;

    switch (routeName) {
      case 'Home':
        iconName = 'home';
        break;
      case 'Categorias':
        iconName = 'grid';
        break;
      case 'Pesquisa':
        iconName = 'plus';
        iconSize = 28;
        break;
      case 'Favorites':
        iconName = 'heart';
        break;
      default:
        iconName = 'home';
    }

    return (
      <FeatherIcon
        name={iconName}
        size={iconSize}
        color={focused ? colors.tabBar.iconActive : colors.tabBar.iconInactive}
        strokeWidth={focused ? 2.5 : 2}
      />
    );
  };

  const renderLabel = (label, focused) => (
    <Text
      style={{
        fontSize: 10,
        marginTop: spacing.xs,
        color: focused ? colors.tabBar.iconActive : colors.tabBar.iconInactive,
        fontWeight: focused ? '600' : '400',
        letterSpacing: 0.2,
      }}
    >
      {label}
    </Text>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              preventDefault: false,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          // FAB central para a aba Pesquisa
          if (route.name === 'Pesquisa') {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.fabButton}
                activeOpacity={0.8}
              >
                <View style={styles.fabCircle}>
                  <FeatherIcon
                    name="plus"
                    size={28}
                    color={colors.white}
                    strokeWidth={2.5}
                  />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[
                styles.tabItem,
                isFocused && styles.tabItemFocused,
              ]}
              activeOpacity={0.6}
            >
              {renderIcon(route.name, isFocused)}
              {renderLabel(label, isFocused)}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    paddingBottom: 0,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.tabBar.background,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    height: 60,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tabItemFocused: {
    backgroundColor: 'rgba(255, 122, 0, 0.05)',
    borderRadius: borderRadius.md,
  },
  fabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  fabCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
