import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication } from '../types';

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false; // Web doesn't support notifications in the same way
  }
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

// Schedule a notification for a medication
export const scheduleMedicationNotification = async (
  medication: Medication,
  time: string,
  sound: boolean = true
): Promise<string> => {
  if (Platform.OS === 'web') {
    return ''; // Web doesn't support notifications in the same way
  }
  
  // Parse the time to schedule
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create a date for the notification
  const notificationDate = new Date();
  notificationDate.setHours(hours, minutes, 0);
  
  // If the time is already passed for today, schedule it for tomorrow
  if (notificationDate < new Date()) {
    notificationDate.setDate(notificationDate.getDate() + 1);
  }
  
  // Schedule the notification
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Medication Reminder',
      body: `It's time to take ${medication.name} (${medication.dosage})`,
      sound,
      data: { medicationId: medication.id, time },
    },
    trigger: {
      hour: hours,
      minute: minutes,
      repeats: true,
    },
  });
  
  return identifier;
};

// Cancel all notifications for a medication
export const cancelMedicationNotifications = async (medicationId: string): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }
  
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.medicationId === medicationId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
};

// Set up notification listener
export const setupNotificationListener = (onNotificationReceived: (notification: any) => void): (() => void) => {
  if (Platform.OS === 'web') {
    return () => {}; // No-op for web
  }
  
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    onNotificationReceived(notification);
  });
  
  // Return cleanup function
  return () => subscription.remove();
};