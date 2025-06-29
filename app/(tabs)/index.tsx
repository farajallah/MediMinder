import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, Linking } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import dateTimeUtils from '@/utils/dateTime';
import Toast from 'react-native-toast-message';

export default function HomeScreen() {
  const { medications, medicationLogs, settings, t, today, logMedicationSkipped } = useApp();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Update the current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Auto-skip missed doses when a later dose becomes due
  useEffect(() => {
    const autoSkipMissedDoses = async () => {
      const currentTime = dateTimeUtils.getCurrentTime();
      
      for (const medication of medications) {
        if (medication.frequency === 'asNeeded') continue;
        
        const sortedTimes = [...medication.times].sort((a, b) => dateTimeUtils.compareTimeStrings(a, b));
        
        for (let i = 0; i < sortedTimes.length; i++) {
          const time = sortedTimes[i];
          const nextTime = sortedTimes[i + 1];
          
          // Check if current dose is missed and next dose is due
          const currentLog = medicationLogs.find(
            log => log.medicationId === medication.id && 
                   log.scheduledTime === time && 
                   log.scheduledDate === today
          );
          
          if (!currentLog && nextTime) {
            const currentStatus = dateTimeUtils.getMedicationStatus(time);
            const nextStatus = dateTimeUtils.getMedicationStatus(nextTime);
            
            // If current dose is missed and next dose is current/due, auto-skip the missed dose
            if (currentStatus === 'missed' && (nextStatus === 'current' || dateTimeUtils.compareTimeStrings(nextTime, currentTime) <= 0)) {
              await logMedicationSkipped(medication.id, time, today, 'Dose was missed - automatically skipped');
            }
          }
        }
      }
    };
    
    autoSkipMissedDoses();
  }, [currentDate, medications, medicationLogs, today, logMedicationSkipped]);
  
  // Get all medication doses for today
  const todayMedications = medications.flatMap(medication => {
    // Skip "as needed" medications for the schedule
    if (medication.frequency === 'asNeeded') {
      return [];
    }
    
    return medication.times.map(time => ({
      id: `${medication.id}_${time}`,
      medicationId: medication.id,
      name: medication.name,
      dosage: medication.dosage,
      time,
      notes: medication.notes,
    }));
  }).sort((a, b) => dateTimeUtils.compareTimeStrings(a.time, b.time));
  
  // Find logs for today's medications
  const getMedicationLogStatus = (medicationId: string, time: string) => {
    const log = medicationLogs.find(
      log => log.medicationId === medicationId && 
             log.scheduledTime === time && 
             log.scheduledDate === today
    );
    
    if (log) {
      return log.status;
    }
    
    // If no log exists, determine status based on time
    return dateTimeUtils.getMedicationStatus(time);
  };
  
  // Group medications by status
  const groupedMedications = todayMedications.reduce((acc, med) => {
    const status = getMedicationLogStatus(med.medicationId, med.time);
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push({...med, status});
    return acc;
  }, {} as Record<string, typeof todayMedications>);
  
  // Group medications by time for better display
  const groupMedicationsByTime = (medications: any[]) => {
    return medications.reduce((acc, med) => {
      const time = med.time;
      if (!acc[time]) {
        acc[time] = [];
      }
      acc[time].push(med);
      return acc;
    }, {} as Record<string, any[]>);
  };
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    setCurrentDate(new Date());
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'taken':
        return <CheckCircle size={20} color="#5DC2AF" />;
      case 'skipped':
        return <XCircle size={20} color="#FF6B6B" />;
      case 'missed':
        return <AlertCircle size={20} color="#FFB156" />;
      default:
        return <Clock size={20} color="#4A90E2" />;
    }
  };

  // Handle badge press
  const handleBadgePress = () => {
    Linking.openURL('https://bolt.new/');
  };

  // Handle medication card press with timing validation
  const handleMedicationPress = (medicationId: string, time: string, status: string) => {
    if (status === 'upcoming') {
      const timeUntil = dateTimeUtils.getTimeUntilDose(time);
      Toast.show({
        type: 'info',
        text1: t('notDueYet') || 'Not Due Yet',
        text2: t('waitForDose') || `This medication is not due yet. Please wait ${timeUntil.hours} hours and ${timeUntil.minutes} minutes.`,
        visibilityTime: 4000,
      });
      return;
    }
    
    // Allow taking current and missed medications
    return `/take/${medicationId}?time=${time}`;
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('todayMeds')}</Text>
            <Text style={styles.date}>
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </Text>
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
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {todayMedications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('noMedsToday')}</Text>
            <Link href="/medications" asChild>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>{t('addMedication')}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
          <>
            {/* Current and upcoming medications */}
            {(groupedMedications.upcoming || groupedMedications.current) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('upcomingDoses')}</Text>
                {Object.entries(groupMedicationsByTime([...(groupedMedications.current || []), ...(groupedMedications.upcoming || [])]))
                  .sort(([timeA], [timeB]) => dateTimeUtils.compareTimeStrings(timeA, timeB))
                  .map(([time, meds]) => (
                    <View key={time}>
                      <View style={styles.timeGroupHeader}>
                        <Text style={styles.timeGroupTitle}>
                          {dateTimeUtils.formatTimeForDisplay(time, settings.timeFormat)}
                        </Text>
                      </View>
                      {meds.map((med) => {
                        const href = handleMedicationPress(med.medicationId, med.time, med.status);
                        
                        if (typeof href === 'string') {
                          return (
                            <Link href={href} key={med.id} asChild>
                              <TouchableOpacity style={styles.medicationCard}>
                                <View style={styles.medicationContent}>
                                  <View style={styles.medicationInfo}>
                                    <Text style={styles.medicationName}>{med.name}</Text>
                                    <Text style={styles.medicationDosage}>{med.dosage}</Text>
                                  </View>
                                  <View style={styles.statusContainer}>
                                    {getStatusIcon(med.status)}
                                  </View>
                                </View>
                              </TouchableOpacity>
                            </Link>
                          );
                        } else {
                          return (
                            <TouchableOpacity 
                              key={med.id} 
                              style={[styles.medicationCard, styles.disabledCard]}
                              onPress={() => handleMedicationPress(med.medicationId, med.time, med.status)}
                            >
                              <View style={styles.medicationContent}>
                                <View style={styles.medicationInfo}>
                                  <Text style={styles.medicationName}>{med.name}</Text>
                                  <Text style={styles.medicationDosage}>{med.dosage}</Text>
                                </View>
                                <View style={styles.statusContainer}>
                                  {getStatusIcon(med.status)}
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        }
                      })}
                      {time !== Object.keys(groupMedicationsByTime([...(groupedMedications.current || []), ...(groupedMedications.upcoming || [])])).sort((a, b) => dateTimeUtils.compareTimeStrings(a, b)).pop() && (
                        <View style={styles.timeSeparator} />
                      )}
                    </View>
                  ))}
              </View>
            )}
            
            {/* Missed medications */}
            {groupedMedications.missed && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('missed')}</Text>
                {Object.entries(groupMedicationsByTime(groupedMedications.missed))
                  .sort(([timeA], [timeB]) => dateTimeUtils.compareTimeStrings(timeA, timeB))
                  .map(([time, meds]) => (
                    <View key={time}>
                      <View style={styles.timeGroupHeader}>
                        <Text style={styles.timeGroupTitle}>
                          {dateTimeUtils.formatTimeForDisplay(time, settings.timeFormat)}
                        </Text>
                      </View>
                      {meds.map((med) => (
                        <Link href={`/take/${med.medicationId}?time=${med.time}`} key={med.id} asChild>
                          <TouchableOpacity style={[styles.medicationCard, styles.missedCard]}>
                            <View style={styles.medicationContent}>
                              <View style={styles.medicationInfo}>
                                <Text style={styles.medicationName}>{med.name}</Text>
                                <Text style={styles.medicationDosage}>{med.dosage}</Text>
                              </View>
                              <View style={styles.statusContainer}>
                                {getStatusIcon('missed')}
                              </View>
                            </View>
                          </TouchableOpacity>
                        </Link>
                      ))}
                      {time !== Object.keys(groupMedicationsByTime(groupedMedications.missed)).sort((a, b) => dateTimeUtils.compareTimeStrings(a, b)).pop() && (
                        <View style={styles.timeSeparator} />
                      )}
                    </View>
                  ))}
              </View>
            )}
          </>
        )}
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
  date: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  timeGroupHeader: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  timeGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  timeSeparator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
    marginHorizontal: 8,
  },
  medicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  disabledCard: {
    opacity: 0.6,
  },
  medicationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  missedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFB156',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666666',
  },
  statusContainer: {
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});