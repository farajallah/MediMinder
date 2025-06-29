import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Minus } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { formatTimeForDisplay, parseTimeToStorage } from '@/utils/dateTime';
import { Medication, FrequencyType } from '@/types';
import Toast from 'react-native-toast-message';

export default function MedicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { medications, addMedication, updateMedication, settings, t } = useApp();
  const insets = useSafeAreaInsets();
  const isNewMedication = id === 'new';
  
  // Find existing medication if editing
  const existingMedication = !isNewMedication 
    ? medications.find(med => med.id === id) 
    : null;
  
  // Form state
  const [name, setName] = useState(existingMedication?.name || '');
  const [dosage, setDosage] = useState(existingMedication?.dosage || '');
  const [frequency, setFrequency] = useState<FrequencyType>(existingMedication?.frequency || 'once');
  const [notes, setNotes] = useState(existingMedication?.notes || '');
  const [times, setTimes] = useState<string[]>(
    existingMedication?.times || [...settings.defaultTimes[frequency]]
  );
  
  // Update times when frequency changes
  useEffect(() => {
    if (isNewMedication) {
      setTimes([...new Set(settings.defaultTimes[frequency])]);
    }
  }, [frequency, isNewMedication, settings.defaultTimes]);
  
  // Handle time change
  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes([...new Set(newTimes)]);
  };
  
  // Add time slot
  const addTimeSlot = () => {
    const newTime = '12:00';
    if (!times.includes(newTime)) {
      setTimes([...times, newTime]);
    }
  };
  
  // Remove time slot
  const removeTimeSlot = (index: number) => {
    if (times.length > 1) {
      const newTimes = [...times];
      newTimes.splice(index, 1);
      setTimes(newTimes);
    }
  };
  
  // Save medication
  const saveMedication = async () => {
    // Validate form
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: t('required'),
        text2: t('medicationNameLabel'),
        visibilityTime: 3000,
      });
      return;
    }
    
    if (!dosage.trim()) {
      Toast.show({
        type: 'error',
        text1: t('required'),
        text2: t('dosageLabel'),
        visibilityTime: 3000,
      });
      return;
    }
    
    // Prepare times (convert from display format to storage format and ensure uniqueness)
    const formattedTimes = frequency === 'asNeeded' 
      ? [] 
      : [...new Set(times.map(time => parseTimeToStorage(time, settings.timeFormat)))];
    
    // Create or update medication
    if (isNewMedication) {
      await addMedication({
        name,
        dosage,
        frequency,
        notes,
        times: formattedTimes,
      });
    } else if (existingMedication) {
      await updateMedication(existingMedication.id, {
        name,
        dosage,
        frequency,
        notes,
        times: formattedTimes,
      });
    }
    
    // Return to medications list
    router.back();
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isNewMedication ? t('addMedication') : t('editMedication')}
        </Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Medication Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('medicationNameLabel')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('medicationNamePlaceholder')}
            placeholderTextColor="#AAAAAA"
          />
        </View>
        
        {/* Dosage */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('dosageLabel')}</Text>
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder={t('dosagePlaceholder')}
            placeholderTextColor="#AAAAAA"
          />
        </View>
        
        {/* Frequency */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('frequencyLabel')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={frequency}
              onValueChange={(value) => setFrequency(value as FrequencyType)}
              style={styles.picker}
            >
              <Picker.Item label={t('once')} value="once" />
              <Picker.Item label={t('twice')} value="twice" />
              <Picker.Item label={t('thrice')} value="thrice" />
              <Picker.Item label={t('four')} value="four" />
              <Picker.Item label={t('asNeeded')} value="asNeeded" />
            </Picker>
          </View>
        </View>
        
        {/* Time Selection (only for scheduled medications) */}
        {frequency !== 'asNeeded' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('timesLabel')}</Text>
            
            {times.map((time, index) => (
              <View key={`${time}_${index}`} style={styles.timeInputRow}>
                <TextInput
                  style={styles.timeInput}
                  value={formatTimeForDisplay(time, settings.timeFormat)}
                  onChangeText={(value) => handleTimeChange(index, value)}
                  placeholder={settings.timeFormat === '12h' ? '8:00 AM' : '08:00'}
                  placeholderTextColor="#AAAAAA"
                />
                
                <TouchableOpacity
                  style={[styles.timeActionButton, styles.removeButton]}
                  onPress={() => removeTimeSlot(index)}
                  disabled={times.length <= 1}
                >
                  <Minus size={18} color={times.length <= 1 ? '#DDDDDD' : '#FF6B6B'} />
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity style={styles.addTimeButton} onPress={addTimeSlot}>
              <Plus size={16} color="#4A90E2" />
              <Text style={styles.addTimeText}>{t('addTime')}</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('notesLabel')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('notesPlaceholder')}
            placeholderTextColor="#AAAAAA"
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>
      
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveButton} onPress={saveMedication}>
          <Text style={styles.saveButtonText}>{t('save')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    padding: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  timeActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  removeButton: {
    borderColor: '#FF6B6B',
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addTimeText: {
    color: '#4A90E2',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});