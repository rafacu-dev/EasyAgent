import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNotifications } from './useNotifications';
import { registerDeviceTokenWithDjango } from './djangoIntegration';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * Provider that handles push notifications automatically
 * Must wrap your application at the highest level
 */
const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children 
}) => {
  const { expoPushToken, sendTokenToServer, clearBadgeCount } = useNotifications();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Register token when available
    if (expoPushToken) {
      registerToken();
    }
  }, [expoPushToken]);

  useEffect(() => {
    // Listener for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription?.remove();
  }, []);

  const registerToken = async () => {
    try {
      if (!expoPushToken) {
        console.log('⚠️ No token available yet');
        return;
      }

      console.log('📤 Sending token to server...', {
        token: expoPushToken.substring(0, 20) + '...'
      });

      // Register token on Django server
      const success = await registerDeviceTokenWithDjango(expoPushToken);
      
      if (success) {
        console.log('✅ Token registered successfully on server');
        await AsyncStorage.setItem('notification_token_registered', 'true');
        await AsyncStorage.setItem('last_token_sent', expoPushToken);
      } else {
        console.error('❌ Error registering token on server');
      }
    } catch (error) {
      console.error('❌ Failed to register notification token:', error);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) && 
      nextAppState === 'active'
    ) {
      // App returned to foreground, clear badges
      clearBadgeCount();
    }
    appState.current = nextAppState;
  };

  return <>{children}</>;
};

export default NotificationProvider;