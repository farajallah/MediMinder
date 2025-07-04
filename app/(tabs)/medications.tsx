import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck, CircleX, CircleAlert as AlertCircle } from 'lucide-react-native';
import { formatTimeForDisplay } from '@/utils/dateTime';

export default function MedicationsHistoryScreen() {
  const { medicationLogs, medications, settings, t } = useApp();
  const insets = useSafeAreaInsets();

  // Group logs by date
  const groupedLogs = medicationLogs.reduce((acc, log) => {
    if (!acc[log.scheduledDate]) {
      acc[log.scheduledDate] = [];
    }
    acc[log.scheduledDate].push(log);
    return acc;
  }, {} as Record<string, typeof medicationLogs>);

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedLogs).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'taken':
        return <CircleCheck size={24} color="#5DC2AF" />;
      case 'skipped':
        return <CircleX size={24} color="#FF6B6B" />;
      case 'missed':
        return <AlertCircle size={24} color="#FFB156" />;
      default:
        return null;
    }
  };

  const getMedicationName = (id: string) => {
    const medication = medications.find(med => med.id === id);
    return medication ? medication.name : 'Unknown Medication';
  };

  const getMedicationDosage = (id: string) => {
    const medication = medications.find(med => med.id === id);
    return medication ? medication.dosage : '';
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
            <Text style={styles.title}>{t('medicineHistory')}</Text>
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
        {sortedDates.map(date => (
          <View key={date} style={styles.dateSection}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </Text>
            </View>
            
            {groupedLogs[date]
              .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
              .map(log => (
                <View key={log.id} style={[
                  styles.logItem,
                  log.status === 'taken' && styles.takenItem,
                  log.status === 'skipped' && styles.skippedItem,
                  log.status === 'missed' && styles.missedItem
                ]}>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>
                      {formatTimeForDisplay(log.scheduledTime, settings.timeFormat)}
                    </Text>
                    {log.actualTime && (
                      <Text style={styles.actualTimeText}>
                        {formatTimeForDisplay(log.actualTime, settings.timeFormat)}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>
                      {getMedicationName(log.medicationId)}
                    </Text>
                    <Text style={styles.medicationDosage}>
                      {getMedicationDosage(log.medicationId)}
                    </Text>
                    {log.skipReason && (
                      <Text style={styles.skipReason}>{log.skipReason}</Text>
                    )}
                  </View>
                  
                  <View style={styles.statusContainer}>
                    {getStatusIcon(log.status)}
                  </View>
                </View>
              ))}
          </View>
        ))}
        
        {sortedDates.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('noMedicationHistory')}</Text>
          </View>
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
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  dateHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  takenItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#5DC2AF',
  },
  skippedItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  missedItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFB156',
  },
  timeContainer: {
    width: 80,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  actualTimeText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  medicationInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  skipReason: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  statusContainer: {
    width: 40,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});