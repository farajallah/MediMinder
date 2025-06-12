import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { CircleCheck, CircleX, CircleAlert as AlertCircle } from 'lucide-react-native';
import { formatTimeForDisplay } from '@/utils/dateTime';

export default function MedicationsHistoryScreen() {
  const { medicationLogs, medications, settings, t } = useApp();

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

  return (
    <ScrollView style={styles.container}>
      {sortedDates.map(date => (
        <View key={date} style={styles.dateSection}>
          <Text style={styles.dateHeader}>
            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
          </Text>
          
          {groupedLogs[date]
            .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
            .map(log => (
              <View key={log.id} style={styles.logItem}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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