import React, { createContext, useContext, useRef } from 'react';
import { Animated } from 'react-native';

const TabBarContext = createContext();

export function TabBarProvider({ children }) {
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;
  const lastOffsetYRef = useRef(0);
  const tabBarHeight = 80;

  const handleScroll = (event) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;
    const diff = currentOffsetY - lastOffsetYRef.current;

    if (Math.abs(diff) < 1) {
      return;
    }

    let newValue = 0;

    if (diff > 0) {
      // Scrolling down - hide tab bar
      newValue = tabBarHeight;
    } else {
      // Scrolling up - show tab bar
      newValue = 0;
    }

    Animated.timing(tabBarTranslateY, {
      toValue: newValue,
      duration: 250,
      useNativeDriver: true,
    }).start();

    lastOffsetYRef.current = currentOffsetY;
  };

  return (
    <TabBarContext.Provider value={{ tabBarTranslateY, handleScroll }}>
      {children}
    </TabBarContext.Provider>
  );
}

export function useTabBar() {
  return useContext(TabBarContext);
}
