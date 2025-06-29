import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, X as XIcon } from 'lucide-react-native';
import { formatTimeForDisplay } from '@/utils/dateTime';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

export default function TakeMedicationScreen() {
  const { id, time } = useLocalSearchParams<{ id: string; time: string }>();
  const { medications, logMedicationTaken, logMedicationSkipped, t, today, settings } = useApp();
  const insets = useSafeAreaInsets();
  const [skipReason, setSkipReason] = useState('');
  const [isSkipping, setIsSkipping] = useState(false);
  
  // Find medication
  const medication = medications.find(med => med.id === id);
  
  // Handle back button
  const handleBack = () => {
    router.back();
  };
  
  // Handle taken button
  const handleTaken = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    if (medication && time) {
      await logMedicationTaken(medication.id, time, today);
      router.back();
    }
  };
  
  // Handle skip button
  const handleSkip = () => {
    setIsSkipping(true);
  };
  
  // Confirm skipping with reason
  const confirmSkip = async () => {
    if (!skipReason.trim()) {
      Toast.show({
        type: 'error',
        text1: t('required'),
        text2: t('skipReason'),
        visibilityTime: 3000,
      });
      return;
    }
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    if (medication && time) {
      await logMedicationSkipped(medication.id, time, today, skipReason);
      router.back();
    }
  };
  
  // If medication not found
  if (!medication) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('takeMedication')}</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Medication not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('takeMedication')}</Text>
      </View>
      
      <View style={styles.content}>
        {!isSkipping ? (
          <>
            <View style={styles.medicationInfo}>
              <Text style={styles.timeText}>
                {formatTimeForDisplay(time || '', settings.timeFormat)}
              </Text>
              <Text style={styles.medicationName}>{medication.name}</Text>
              <Text style={styles.medicationDosage}>{medication.dosage}</Text>
              
              {medication.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>{t('notesLabel')}:</Text>
                  <Text style={styles.notesText}>{medication.notes}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.actions}>
              <TouchableOpacity style={styles.takenButton} onPress={handleTaken}>
                <Check size={24} color="#FFFFFF" />
                <Text style={styles.takenButtonText}>{t('confirmTaken')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <XIcon size={24} color="#FFFFFF" />
                <Text style={styles.skipButtonText}>{t('skipDose')}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.skipForm}>
            <Text style={styles.skipTitle}>{t('skipReason')}</Text>
            <TextInput
              style={styles.skipReasonInput}
              value={skipReason}
              onChangeText={setSkipReason}
              placeholder={t('skipReasonPlaceholder')}
              placeholderTextColor="#AAAAAA"
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.skipActions}>
              <TouchableOpacity style={styles.cancelSkipButton} onPress={() => setIsSkipping(false)}>
                <Text style={styles.cancelSkipText}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.confirmSkipButton} onPress={confirmSkip}>
                <Text style={styles.confirmSkipText}>{t('confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    padding: 16,
  },
  closeButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    justifyContent: 'space-between',
  },
  medicationInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  timeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 16,
  },
  medicationName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  medicationDosage: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  notesContainer: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666666',
  },
  actions: {
    marginTop: 40,
  },
  takenButton: {
    backgroundColor: '#5DC2AF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  takenButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  skipButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  skipForm: {
    padding: 24,
  },
  skipTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  skipReasonInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    height: 120,
    fontSize: 16,
    color: '#333333',
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  skipActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelSkipButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelSkipText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmSkipButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmSkipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});