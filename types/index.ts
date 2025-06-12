export type FrequencyType = 'once' | 'twice' | 'thrice' | 'four' | 'asNeeded';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: FrequencyType;
  notes?: string;
  times: string[]; // Array of times in 24h format (e.g., ["08:00", "20:00"])
  createdAt: number;
  updatedAt: number;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  scheduledTime: string; // In 24h format
  scheduledDate: string; // YYYY-MM-DD
  status: 'taken' | 'skipped' | 'missed';
  actualTime?: string; // When medication was taken/skipped
  skipReason?: string;
  timestamp: number;
}

export interface AppSettings {
  language: 'en' | 'ar' | 'tr';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  timeFormat: '12h' | '24h';
  apiUrl: string;
  defaultTimes: {
    once: string[];
    twice: string[];
    thrice: string[];
    four: string[];
  };
}