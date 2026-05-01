import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Screens
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
import { FuzzTestingScreen } from '../screens/FuzzTestingScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabBarLabel = ({ label, focused, color }: { label: string; focused: boolean; color: string }) => (
  <Text style={[styles.tabLabel, { color, fontWeight: focused ? '700' : '500' }]}>
    {label}
  </Text>
);

function MainTabs() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.navBackground,
          borderTopColor: theme.colors.cardBorder,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.4 : 0.08,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: ({ focused, color }) => <TabBarLabel label="Home" focused={focused} color={color} />,
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[styles.tabIconWrap, focused && { backgroundColor: theme.colors.accent + '15' }]}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="DocumentVault"
        component={DocumentVaultScreen}
        options={{
          tabBarLabel: ({ focused, color }) => <TabBarLabel label="Vault" focused={focused} color={color} />,
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconWrap, focused && { backgroundColor: theme.colors.accent + '15' }]}>
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="NomineeManagement"
        component={NomineeManagementScreen}
        options={{
          tabBarLabel: ({ focused, color }) => <TabBarLabel label="Nominees" focused={focused} color={color} />,
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconWrap, focused && { backgroundColor: theme.colors.accent + '15' }]}>
              <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: ({ focused, color }) => <TabBarLabel label="Profile" focused={focused} color={color} />,
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconWrap, focused && { backgroundColor: theme.colors.accent + '15' }]}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isDark, theme } = useTheme();

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
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="ConnectAccounts" component={ConnectAccountsScreen} />
        <Stack.Screen name="NGONominee" component={NGONomineeScreen} />
        <Stack.Screen name="AIDocumentProcessing" component={AIDocumentProcessingScreen} />
        <Stack.Screen name="BlockchainVerification" component={BlockchainVerificationScreen} />
        <Stack.Screen name="GenerateReport" component={GenerateWealthReportScreen} />
        <Stack.Screen name="KYCVerification" component={KYCVerificationScreen} />
        <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
        <Stack.Screen name="FuzzTesting" component={FuzzTestingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabIconWrap: {
    width: 40,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
