import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, Linking } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import dateTimeUtils from '@/utils/dateTime';

export default function HomeScreen() {
  const { medications, medicationLogs, settings, t, today } = useApp();
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
                {[...(groupedMedications.current || []), ...(groupedMedications.upcoming || [])]
                  .sort((a, b) => dateTimeUtils.compareTimeStrings(a.time, b.time))
                  .map((med) => (
                    <Link href={`/take/${med.medicationId}?time=${med.time}`} key={med.id} asChild>
                      <TouchableOpacity style={styles.medicationCard}>
                        <View style={styles.timeContainer}>
                          <Text style={styles.timeText}>
                            {dateTimeUtils.formatTimeForDisplay(med.time, settings.timeFormat)}
                          </Text>
                          {getStatusIcon(med.status)}
                        </View>
                        <View style={styles.medicationInfo}>
                          <Text style={styles.medicationName}>{med.name}</Text>
                          <Text style={styles.medicationDosage}>{med.dosage}</Text>
                        </View>
                      </TouchableOpacity>
                    </Link>
                  ))}
              </View>
            )}
            
            {/* Taken medications */}
            {groupedMedications.taken && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('taken')}</Text>
                {groupedMedications.taken.map((med) => (
                  <TouchableOpacity key={med.id} style={StyleSheet.flatten([styles.medicationCard, styles.takenCard])}>
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>
                        {dateTimeUtils.formatTimeForDisplay(med.time, settings.timeFormat)}
                      </Text>
                      {getStatusIcon('taken')}
                    </View>
                    <View style={styles.medicationInfo}>
                      <Text style={styles.medicationName}>{med.name}</Text>
                      <Text style={styles.medicationDosage}>{med.dosage}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Missed medications */}
            {groupedMedications.missed && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('missed')}</Text>
                {groupedMedications.missed.map((med) => (
                  <Link href={`/take/${med.medicationId}?time=${med.time}`} key={med.id} asChild>
                    <TouchableOpacity style={StyleSheet.flatten([styles.medicationCard, styles.missedCard])}>
                      <View style={styles.timeContainer}>
                        <Text style={styles.timeText}>
                          {dateTimeUtils.formatTimeForDisplay(med.time, settings.timeFormat)}
                        </Text>
                        {getStatusIcon('missed')}
                      </View>
                      <View style={styles.medicationInfo}>
                        <Text style={styles.medicationName}>{med.name}</Text>
                        <Text style={styles.medicationDosage}>{med.dosage}</Text>
                      </View>
                    </TouchableOpacity>
                  </Link>
                ))}
              </View>
            )}
            
            {/* Skipped medications */}
            {groupedMedications.skipped && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('skipped')}</Text>
                {groupedMedications.skipped.map((med) => (
                  <TouchableOpacity key={med.id} style={StyleSheet.flatten([styles.medicationCard, styles.skippedCard])}>
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>
                        {dateTimeUtils.formatTimeForDisplay(med.time, settings.timeFormat)}
                      </Text>
                      {getStatusIcon('skipped')}
                    </View>
                    <View style={styles.medicationInfo}>
                      <Text style={styles.medicationName}>{med.name}</Text>
                      <Text style={styles.medicationDosage}>{med.dosage}</Text>
                    </View>
                  </TouchableOpacity>
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
    width: 80,
    height: 32,
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
  medicationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  takenCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#5DC2AF',
  },
  missedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFB156',
  },
  skippedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  timeContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
    paddingRight: 12,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  medicationInfo: {
    flex: 1,
    paddingLeft: 16,
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