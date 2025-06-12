import { useCallback, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { I18nProvider, TranslationProvider } from 'expo-router/i18n';
import { AppProvider } from '@/contexts/AppContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, View, Text, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

if (Platform.OS !== 'web') {
  // Configure notifications
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export default function RootLayout() {
  useFrameworkReady();
  
  // Load fonts
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf'),
    'Inter-Medium': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf'),
    'Inter-Bold': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      // Initialize any app data
      const hasInitialized = await AsyncStorage.getItem('app:initialized');
      if (!hasInitialized) {
        // First-time setup logic could go here
        await AsyncStorage.setItem('app:initialized', 'true');
      }
      
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading MedReminder...</Text>
      </View>
    );
  }

  return (
    <AppProvider>
      <Stack screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="medication/[id]" options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }} />
        <Stack.Screen name="take/[id]" options={{ 
          presentation: 'modal',
          animation: 'fade'
        }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      <StatusBar style="auto" />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#4A90E2',
  },
});