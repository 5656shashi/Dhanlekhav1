import React from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import { OTPLoginScreen } from '../screens/OTPLoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { DocumentVaultScreen } from '../screens/DocumentVaultScreen';
import { NomineeManagementScreen } from '../screens/NomineeManagementScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ConnectAccountsScreen } from '../screens/ConnectAccountsScreen';
import { NGONomineeScreen } from '../screens/NGONomineeScreen';
import { AIDocumentProcessingScreen } from '../screens/AIDocumentProcessingScreen';
import { BlockchainVerificationScreen } from '../screens/BlockchainVerificationScreen';
import { GenerateWealthReportScreen } from '../screens/GenerateWealthReportScreen';
import { KYCVerificationScreen } from '../screens/KYCVerificationScreen';
import { SecuritySettingsScreen } from '../screens/SecuritySettingsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { PaymentHistoryScreen } from '../screens/PaymentHistoryScreen';
import { SecurityLabScreen } from '../screens/SecurityLabScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabLabel = ({ label, focused, color }: { label: string; focused: boolean; color: string }) => (
  <Text style={[styles.tabLabel, { color, fontWeight: focused ? '700' : '500' }]}>{label}</Text>
);

function MainTabs() {
  const { theme, isDark } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: theme.colors.navBackground,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 15,
          elevation: 20,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ tabBarLabel: ({ focused, color }) => <TabLabel label="Home" focused={focused} color={color} />,
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIcon, focused && { backgroundColor: theme.colors.accent + '15' }]}>
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
            </View>
          ) }} />
      <Tab.Screen name="DocumentVault" component={DocumentVaultScreen}
        options={{ tabBarLabel: ({ focused, color }) => <TabLabel label="Vault" focused={focused} color={color} />,
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIcon, focused && { backgroundColor: theme.colors.accent + '15' }]}>
              <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={22} color={color} />
            </View>
          ) }} />
      <Tab.Screen name="NomineeManagement" component={NomineeManagementScreen}
        options={{ tabBarLabel: ({ focused, color }) => <TabLabel label="Nominees" focused={focused} color={color} />,
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIcon, focused && { backgroundColor: theme.colors.accent + '15' }]}>
              <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />
            </View>
          ) }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarLabel: ({ focused, color }) => <TabLabel label="Profile" focused={focused} color={color} />,
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIcon, focused && { backgroundColor: theme.colors.accent + '15' }]}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
            </View>
          ) }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="OTPLogin" component={OTPLoginScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="ConnectAccounts" component={ConnectAccountsScreen} />
      <Stack.Screen name="NGONominee" component={NGONomineeScreen} />
      <Stack.Screen name="AIDocumentProcessing" component={AIDocumentProcessingScreen} />
      <Stack.Screen name="BlockchainVerification" component={BlockchainVerificationScreen} />
      <Stack.Screen name="GenerateReport" component={GenerateWealthReportScreen} />
      <Stack.Screen name="KYCVerification" component={KYCVerificationScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <Stack.Screen name="SecurityLab" component={SecurityLabScreen} />
    </Stack.Navigator>
  );
}

function LoadingScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.loadingScreen, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.accent} />
    </View>
  );
}

export function AppNavigator() {
  const { isDark, theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  const navTheme = {
    dark: isDark,
    colors: {
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.cardBorder,
      notification: theme.colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      {isLoading ? <LoadingScreen /> : isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  tabIcon: { width: 48, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
