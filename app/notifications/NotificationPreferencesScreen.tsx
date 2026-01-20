import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from './useNotifications';
import { useTranslation } from 'react-i18next';

interface NotificationPreferences {
  enabled: boolean;
  calls: boolean;
  appointments: boolean;
  reminders: boolean;
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  calls: true,
  appointments: true,
  reminders: true,
};

const NotificationPreferencesScreen: React.FC = () => {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { expoPushToken } = useNotifications();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async (): Promise<void> => {
    try {
      const savedPreferences = await AsyncStorage.getItem('notification_preferences');
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences): Promise<void> => {
    try {
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(newPreferences));
      setPreferences(newPreferences);
      
      // Optionally, send preferences to server
      await syncPreferencesWithServer(newPreferences);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      Alert.alert(t('common.error'), t('notifications.preferencesError'));
    }
  };

  const syncPreferencesWithServer = async (prefs: NotificationPreferences): Promise<void> => {
    try {
      if (!expoPushToken) {
        console.warn('No push token available for syncing preferences');
        return;
      }

      // Here you would implement the call to your API to sync preferences
      // const response = await fetch('/notifications/preferences', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     token: expoPushToken,
      //     preferences: prefs,
      //   }),
      // });
      
      console.log('Syncing preferences with server:', prefs);
    } catch (error) {
      console.error('Error syncing preferences with server:', error);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences): void => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    savePreferences(newPreferences);
  };

  const testNotification = async (): Promise<void> => {
    try {
      if (!expoPushToken) {
        Alert.alert(t('common.error'), 'No push token available');
        return;
      }

      // Send test notification
      Alert.alert(
        'Test Notification',
        'A test notification will be sent in 3 seconds',
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.submit'),
            onPress: () => {
              // Here you would implement the call to your API to send a test notification
              setTimeout(() => {
                Alert.alert('Info', 'Test notification sent successfully');
              }, 3000);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('notifications.loadingPreferences')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('notifications.preferences')}</Text>
        <Text style={styles.subtitle}>
          {t('notifications.customizeNotifications')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notifications.pushNotifications')}</Text>
        
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceContent}>
            <Text style={styles.preferenceLabel}>Enable Notifications</Text>
            <Text style={styles.preferenceDescription}>
              Allow app to send push notifications
            </Text>
          </View>
          <Switch
            value={preferences.enabled}
            onValueChange={() => togglePreference('enabled')}
            trackColor={{ false: '#767577', true: '#8d36ff' }}
            thumbColor={preferences.enabled ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceContent}>
            <Text style={styles.preferenceLabel}>Calls</Text>
            <Text style={styles.preferenceDescription}>
              Notifications about incoming calls and messages
            </Text>
          </View>
          <Switch
            value={preferences.calls}
            onValueChange={() => togglePreference('calls')}
            trackColor={{ false: '#767577', true: '#8d36ff' }}
            thumbColor={preferences.calls ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceContent}>
            <Text style={styles.preferenceLabel}>Appointments</Text>
            <Text style={styles.preferenceDescription}>
              Notifications about scheduled appointments
            </Text>
          </View>
          <Switch
            value={preferences.appointments}
            onValueChange={() => togglePreference('appointments')}
            trackColor={{ false: '#767577', true: '#8d36ff' }}
            thumbColor={preferences.appointments ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceContent}>
            <Text style={styles.preferenceLabel}>Reminders</Text>
            <Text style={styles.preferenceDescription}>
              General reminders and alerts
            </Text>
          </View>
          <Switch
            value={preferences.reminders}
            onValueChange={() => togglePreference('reminders')}
            trackColor={{ false: '#767577', true: '#8d36ff' }}
            thumbColor={preferences.reminders ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notifications.deviceInformation')}</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>{t('notifications.tokenStatus')}</Text>
          <Text style={styles.infoValue}>
            {expoPushToken ? t('notifications.registered') : t('notifications.notAvailable')}
          </Text>
        </View>
        {expoPushToken && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('notifications.token')}</Text>
            <Text style={styles.infoValueSmall} numberOfLines={2}>
              {expoPushToken}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.testButton} onPress={testNotification}>
          <Text style={styles.testButtonText}>{t('notifications.sendTestNotification')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#8d36ff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  section: {
    backgroundColor: 'white',
    marginVertical: 10,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceContent: {
    flex: 1,
    marginRight: 15,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    width: 120,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  infoValueSmall: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    fontFamily: 'monospace',
  },
  actions: {
    padding: 20,
  },
  testButton: {
    backgroundColor: '#8d36ff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationPreferencesScreen;