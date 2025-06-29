import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Platform, I18nManager } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import { AppSettings, Medication, MedicationLog } from '../types';
import translations from '../localization/translations';

// Default app settings
const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  notificationsEnabled: true,
  soundEnabled: true,
  timeFormat: '12h',
  apiUrl: 'https://mock.apidog.com/m2/962827-947413-default/18105535',
  defaultTimes: {
    once: ['08:00'],
    twice: ['08:00', '20:00'],
    thrice: ['08:00', '14:00', '20:00'],
    four: ['08:00', '12:00', '16:00', '20:00']
  }
};

// Setup i18n
const i18n = new I18n(translations);
i18n.enableFallback = true;

// Setup notifications
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true
    })
  });
}

// Context interface
interface AppContextProps {
  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  
  // Medications
  medications: Medication[];
  addMedication: (medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Medication>;
  updateMedication: (id: string, updates: Partial<Medication>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  
  // Medication logs
  medicationLogs: MedicationLog[];
  logMedicationTaken: (medicationId: string, scheduledTime: string, scheduledDate: string) => Promise<void>;
  logMedicationSkipped: (medicationId: string, scheduledTime: string, scheduledDate: string, reason: string) => Promise<void>;
  
  // API
  loadMedicinesFromApi: () => Promise<void>;
  
  // Translations
  t: (key: string, params?: object) => string;
  
  // Current date info
  today: string;
  isLoading: boolean;
}

// Create context
const AppContext = createContext<AppContextProps | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: 'medHelper:settings',
  MEDICATIONS: 'medHelper:medications',
  LOGS: 'medHelper:logs'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Initialize i18n with the current locale
  i18n.locale = settings.language;

  // Load data from storage on app start
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load settings
        const storedSettings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        } else {
          // Detect device language and set as default if supported
          const deviceLocale = Localization.locale || 'en';
          const languageCode = deviceLocale.split('-')[0] || 'en';
          if (['en', 'ar', 'tr'].includes(languageCode)) {
            setSettings({ ...DEFAULT_SETTINGS, language: languageCode as 'en' | 'ar' | 'tr' });
          }
        }

        // Load medications
        const storedMedications = await AsyncStorage.getItem(STORAGE_KEYS.MEDICATIONS);
        if (storedMedications) {
          setMedications(JSON.parse(storedMedications));
        } else {
          const default_medicines = `[
            {
              "id": "med_default_1",
              "name": "Paracetamol 500mg",
              "dosage": "500mg",
              "frequency": "four",
              "times": ["08:00", "12:00", "16:00", "20:00"],
              "notes": "After meal",
              "createdAt": ${Date.now()},
              "updatedAt": ${Date.now()}
            },
            {
              "id": "med_default_2",
              "name": "Amoxicillin 250mg",
              "dosage": "250mg",
              "frequency": "thrice",
              "times": ["08:00", "14:00", "20:00"],
              "notes": "Before meal, full glass of water",
              "createdAt": ${Date.now()},
              "updatedAt": ${Date.now()}
            },
            {
              "id": "med_default_3",
              "name": "Metformin 850mg",
              "dosage": "850mg",
              "frequency": "twice",
              "times": ["08:00", "20:00"],
              "notes": "With meal",
              "createdAt": ${Date.now()},
              "updatedAt": ${Date.now()}
            },
            {
              "id": "med_default_4",
              "name": "Vitamin D3 1000IU",
              "dosage": "1000IU",
              "frequency": "once",
              "times": ["08:00"],
              "notes": "After breakfast",
              "createdAt": ${Date.now()},
              "updatedAt": ${Date.now()}
            },
            {
              "id": "med_default_5",
              "name": "Ibuprofen 200mg",
              "dosage": "200mg",
              "frequency": "asNeeded",
              "times": [],
              "notes": "After meal, not on empty stomach",
              "createdAt": ${Date.now()},
              "updatedAt": ${Date.now()}
            }
          ]`;
          setMedications(JSON.parse(default_medicines));
        }

        // Load medication logs
        const storedLogs = await AsyncStorage.getItem(STORAGE_KEYS.LOGS);
        if (storedLogs) {
          setMedicationLogs(JSON.parse(storedLogs));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save settings to storage and handle RTL whenever they change
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      
      // Update i18n locale when language changes
      i18n.locale = settings.language;
      
      // Handle RTL for non-web platforms
      if (Platform.OS !== 'web') {
        if (settings.language === 'ar' && !I18nManager.isRTL) {
          I18nManager.forceRTL(true);
        } else if (settings.language !== 'ar' && I18nManager.isRTL) {
          I18nManager.forceRTL(false);
        }
      }
    }
  }, [settings, isLoading]);

  // Save medications to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(medications));
    }
  }, [medications, isLoading]);

  // Save medication logs to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(medicationLogs));
    }
  }, [medicationLogs, isLoading]);

  // Load medicines from API
  const loadMedicinesFromApi = useCallback(async () => {
    try {
      if (__DEV__) {
        console.info('[API] Fetching medicines from:', settings.apiUrl);
      }
      
      const response = await fetch(settings.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      let data = await response.json();
      
      if (__DEV__) {
        console.info('[API] Received data:', data);
      }
      
      // Ensure data is an array
      if (!data['data']) {
        if (__DEV__) {
          console.warn('[API] Response is not an array, using empty array instead');
        }
        data = [];
      }else{
        data = data['data'];
      }
      
      // Convert API data to medication format
      const newMedications: Medication[] = data.map((med: any) => ({
        id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: med.name,
        dosage: med.dosage || '1 tablet',
        frequency: med.frequency || 'once',
        times: med.times || ['08:00'],
        notes: med.notes || '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));
      console.info(newMedications);

      if (__DEV__) {
        console.info('[API] Processed medications:', newMedications);
      }

      // Update medications state
      setMedications(prev => [...prev, ...newMedications]);
    } catch (error) {
      if (__DEV__) {
        console.error('[API] Error loading medicines:', error);
      }
      throw error;
    }
  }, [settings.apiUrl]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  }, []);

  // Add new medication
  const addMedication = useCallback(async (medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const newMedication: Medication = {
      ...medicationData,
      id: `med_${now}`,
      createdAt: now,
      updatedAt: now
    };
    
    setMedications(prev => [...prev, newMedication]);
    return newMedication;
  }, []);

  // Update existing medication
  const updateMedication = useCallback(async (id: string, updates: Partial<Medication>) => {
    setMedications(prev => 
      prev.map(med => 
        med.id === id 
          ? { ...med, ...updates, updatedAt: Date.now() } 
          : med
      )
    );
  }, []);

  // Delete medication
  const deleteMedication = useCallback(async (id: string) => {
    setMedications(prev => prev.filter(med => med.id !== id));
  }, []);

  // Log medication as taken
  const logMedicationTaken = useCallback(async (medicationId: string, scheduledTime: string, scheduledDate: string) => {
    const now = Date.now();
    const newLog: MedicationLog = {
      id: `log_${now}`,
      medicationId,
      scheduledTime,
      scheduledDate,
      status: 'taken',
      actualTime: format(new Date(), 'HH:mm'),
      timestamp: now
    };
    
    setMedicationLogs(prev => [...prev, newLog]);
  }, []);

  // Log medication as skipped
  const logMedicationSkipped = useCallback(async (medicationId: string, scheduledTime: string, scheduledDate: string, reason: string) => {
    const now = Date.now();
    const newLog: MedicationLog = {
      id: `log_${now}`,
      medicationId,
      scheduledTime,
      scheduledDate,
      status: 'skipped',
      actualTime: format(new Date(), 'HH:mm'),
      skipReason: reason,
      timestamp: now
    };
    
    setMedicationLogs(prev => [...prev, newLog]);
  }, []);

  // Translation function
  const t = useCallback((key: string, params?: object) => {
    return i18n.t(key, params);
  }, [settings.language]);

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        medications,
        addMedication,
        updateMedication,
        deleteMedication,
        medicationLogs,
        logMedicationTaken,
        logMedicationSkipped,
        loadMedicinesFromApi,
        t,
        today,
        isLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};