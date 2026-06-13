import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export function useScreenTutorial(screenKey: string) {
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(`tutorial_seen_${screenKey}`).then(val => {
      if (!val) setShow(true);
      setReady(true);
    }).catch(() => setReady(true));
  }, [screenKey]);

  const dismiss = async () => {
    setShow(false);
    await SecureStore.setItemAsync(`tutorial_seen_${screenKey}`, '1').catch(() => {});
  };

  return { showTutorial: show && ready, dismissTutorial: dismiss };
}
