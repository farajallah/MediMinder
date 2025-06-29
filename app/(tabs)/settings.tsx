import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Switch, TouchableOpacity, Image, Linking } from 'react-native';
import { Globe, Bell, Clock, Download } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dateTimeUtils from '@/utils/dateTime';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

const TIME_OPTIONS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

export default function Settings() {
  const { t, settings, updateSettings, loadMedicinesFromApi } = useApp();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleTimeChange = (frequency: string, index: number, newTime: string) => {
    const newTimes = [...settings.defaultTimes[frequency]];
    newTimes[index] = newTime;
    updateSettings({
      defaultTimes: {
        ...settings.defaultTimes,
        [frequency]: newTimes
      }
    });
  };

  const handleLoadMedicines = async () => {
    setIsLoading(true);
    try {
      await loadMedicinesFromApi();
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: t('medicinesLoaded'),
        text2: t('medicinesLoaded'),
        visibilityTime: 3000,
        onHide: () => {
          // Navigate to home page
          router.push('/(tabs)/');
        }
      });
      
      if (__DEV__) {
        console.log('[Settings]', t('medicinesLoaded'));
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('errorLoadingMedicines'),
        text2: error instanceof Error ? error.message : 'Unknown error occurred',
        visibilityTime: 4000,
      });
      
      if (__DEV__) {
        console.log('[Settings]', t('errorLoadingMedicines'), error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle badge press
  const handleBadgePress = () => {
    Linking.openURL('https://bolt.new/');
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('settings')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.badgeContainer} 
            onPress={handleBadgePress}
            activeOpacity={0.8}
          >
            <Image 
              source={require('@/assets/images/bolt.new-badge.png')} 
              style={styles.badge}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* API Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color="#4A90E2" />
            <Text style={styles.sectionTitle}>{t('apiSettings')}</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('apiUrl')}</Text>
            <TextInput
              style={styles.input}
              value={settings.apiUrl || ''}
              onChangeText={(value) => updateSettings({ apiUrl: value })}
              placeholder="https://example.com/api"
              placeholderTextColor="#AAAAAA"
            />
          </View>

          <TouchableOpacity 
            style={[styles.loadButton, isLoading && styles.loadButtonDisabled]}
            onPress={handleLoadMedicines}
            disabled={isLoading}>
            <Download size={20} color="#FFFFFF" />
            <Text style={styles.loadButtonText}>
              {isLoading ? t('loadingMedicines') : t('loadMedicines')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#4A90E2" />
            <Text style={styles.sectionTitle}>{t('notifications')}</Text>
          </View>
          
          <View style={styles.switchGroup}>
            <Text style={styles.switchLabel}>{t('notificationsEnabled')}</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) => updateSettings({ notificationsEnabled: value })}
              trackColor={{ false: '#D1D1D1', true: '#4A90E2' }}
            />
          </View>

          <View style={styles.switchGroup}>
            <Text style={styles.switchLabel}>{t('soundEnabled')}</Text>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => updateSettings({ soundEnabled: value })}
              trackColor={{ false: '#D1D1D1', true: '#4A90E2' }}
            />
          </View>
        </View>

        {/* Language Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color="#4A90E2" />
            <Text style={styles.sectionTitle}>{t('language')}</Text>
          </View>
          
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={settings.language}
              onValueChange={(value) => updateSettings({ language: value })}
              style={styles.picker}
            >
              <Picker.Item label={t('english')} value="en" />
              <Picker.Item label={t('arabic')} value="ar" />
              <Picker.Item label={t('turkish')} value="tr" />
            </Picker>
          </View>
        </View>

        {/* Time Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#4A90E2" />
            <Text style={styles.sectionTitle}>{t('timePreferences')}</Text>
          </View>

          <View style={styles.switchGroup}>
            <Text style={styles.switchLabel}>{t('timeFormat')}</Text>
            <Switch
              value={settings.timeFormat === '24h'}
              onValueChange={(value) => updateSettings({ timeFormat: value ? '24h' : '12h' })}
              trackColor={{ false: '#D1D1D1', true: '#4A90E2' }}
            />
            <Text style={styles.switchValue}>
              {settings.timeFormat === '24h' ? t('format24h') : t('format12h')}
            </Text>
          </View>

          <Text style={styles.subSectionTitle}>{t('defaultTimes')}</Text>
          
          {Object.entries(settings.defaultTimes).map(([frequency, times]) => (
            <View key={frequency} style={styles.timeGroup}>
              <Text style={styles.timeLabel}>{t(frequency)}</Text>
              <View style={styles.timePickerContainer}>
                {times.map((time, index) => (
                  <View key={index} style={styles.timePickerWrapper}>
                    <Picker
                      selectedValue={time}
                      onValueChange={(value) => handleTimeChange(frequency, index, value)}
                      style={styles.timePicker}
                    >
                      {TIME_OPTIONS.map((option) => (
                        <Picker.Item
                          key={option}
                          label={dateTimeUtils.formatTimeForDisplay(option, settings.timeFormat)}
                          value={option}
                        />
                      ))}
                    </Picker>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#4A90E2',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  badgeContainer: {
    marginLeft: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    width: 100,
    height: 60,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  switchValue: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 6,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  timeGroup: {
    marginBottom: 20,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  timePickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timePickerWrapper: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 6,
    overflow: 'hidden',
    width: 120,
  },
  timePicker: {
    height: 40,
  },
  loadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5DC2AF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  loadButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  loadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});