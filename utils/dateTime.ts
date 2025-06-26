import { format, parse, isValid } from 'date-fns';
import { AppSettings } from '../types';

// Format a time string based on user preferences (12h or 24h)
const formatTimeForDisplay = (
  timeString: string,
  timeFormat: AppSettings['timeFormat']
): string => {
  if (!timeString) return '';
  
  try {
    // Parse the time string (which is in 24h format)
    const date = parse(timeString, 'HH:mm', new Date());
    
    if (!isValid(date)) {
      return timeString;
    }
    
    // Format based on user preference
    if (timeFormat === '12h') {
      return format(date, 'h:mm a');
    } else {
      return format(date, 'HH:mm');
    }
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

// Parse a display time back to 24h format for storage
const parseTimeToStorage = (
  displayTime: string,
  timeFormat: AppSettings['timeFormat']
): string => {
  try {
    let date;
    
    if (timeFormat === '12h') {
      // Parse 12h format
      date = parse(displayTime, 'h:mm a', new Date());
    } else {
      // Parse 24h format
      date = parse(displayTime, 'HH:mm', new Date());
    }
    
    if (!isValid(date)) {
      throw new Error('Invalid date');
    }
    
    // Always store in 24h format
    return format(date, 'HH:mm');
  } catch (error) {
    console.error('Error parsing time:', error);
    return '';
  }
};

// Check if a time string is valid
const isTimeStringValid = (
  timeString: string,
  timeFormat: AppSettings['timeFormat']
): boolean => {
  try {
    let date;
    
    if (timeFormat === '12h') {
      date = parse(timeString, 'h:mm a', new Date());
    } else {
      date = parse(timeString, 'HH:mm', new Date());
    }
    
    return isValid(date);
  } catch {
    return false;
  }
};

// Get current time in 24h format
const getCurrentTime = (): string => {
  return format(new Date(), 'HH:mm');
};

// Compare two time strings (both in 24h format)
const compareTimeStrings = (time1: string, time2: string): number => {
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);
  
  if (hours1 === hours2) {
    return minutes1 - minutes2;
  }
  
  return hours1 - hours2;
};

// Get the status of a medication dose based on the current time
const getMedicationStatus = (scheduledTime: string): 'upcoming' | 'missed' | 'current' => {
  const currentTime = getCurrentTime();
  const currentHour = parseInt(currentTime.split(':')[0], 10);
  const currentMinute = parseInt(currentTime.split(':')[1], 10);
  const scheduledHour = parseInt(scheduledTime.split(':')[0], 10);
  const scheduledMinute = parseInt(scheduledTime.split(':')[1], 10);
  
  // If scheduled time is more than 2 hours in the past, mark as missed
  if (scheduledHour < currentHour - 2 || 
      (scheduledHour === currentHour - 2 && scheduledMinute < currentMinute)) {
    return 'missed';
  }
  
  // If scheduled time is in the future, mark as upcoming
  if (scheduledHour > currentHour || 
      (scheduledHour === currentHour && scheduledMinute > currentMinute)) {
    return 'upcoming';
  }
  
  // Otherwise, it's current (within 2 hours window)
  return 'current';
};

// Get time until a dose is due (for upcoming medications)
const getTimeUntilDose = (scheduledTime: string): { hours: number; minutes: number } => {
  const currentTime = getCurrentTime();
  const [currentHour, currentMinute] = currentTime.split(':').map(Number);
  const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
  
  let totalCurrentMinutes = currentHour * 60 + currentMinute;
  let totalScheduledMinutes = scheduledHour * 60 + scheduledMinute;
  
  // If scheduled time is tomorrow (past midnight), add 24 hours
  if (totalScheduledMinutes < totalCurrentMinutes) {
    totalScheduledMinutes += 24 * 60;
  }
  
  const diffMinutes = totalScheduledMinutes - totalCurrentMinutes;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  return { hours, minutes };
};

export default {
  formatTimeForDisplay,
  parseTimeToStorage,
  isTimeStringValid,
  getCurrentTime,
  compareTimeStrings,
  getMedicationStatus,
  getTimeUntilDose
};

export { formatTimeForDisplay, parseTimeToStorage }