import 'react-native-url-polyfill/auto';
import { registerRootComponent } from 'expo';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';

type AppState = 'SPLASH' | 'LOGIN' | 'MAIN';

function AppContent() {
  const { isDark } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [appState, setAppState] = useState<AppState>('SPLASH');

  const [fontsLoaded] = useFonts({
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  // Effect to handle auth state transitions
  useEffect(() => {
    if (appState === 'MAIN' && !isAuthenticated) {
      setAppState('LOGIN');
    } else if (appState === 'LOGIN' && isAuthenticated) {
      setAppState('MAIN');
    }
  }, [isAuthenticated, appState]);

  if (!fontsLoaded || authLoading) {
    return <View style={[styles.loading, { backgroundColor: isDark ? '#101415' : '#F8FAFC' }]} />;
  }

  if (appState === 'SPLASH') {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} translucent />
        <SplashScreen onFinish={() => setAppState(isAuthenticated ? 'MAIN' : 'LOGIN')} />
      </>
    );
  }

  if (appState === 'LOGIN') {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <LoginScreen onLogin={() => setAppState('MAIN')} />
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);

const styles = StyleSheet.create({
  loading: {
    flex: 1,
  },
});
