import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Typography } from '../theme/typography';
import { Alert } from 'react-native';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  rightAction?: () => void;
  showThemeToggle?: boolean;
}

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

export const Header = ({
  title = 'DhanLekha',
  showBack = false,
  onBack,
  rightIcon,
  rightAction,
  showThemeToggle = false,
}: HeaderProps) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const handleLogoPress = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out of DhanLekha?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.headerBackground,
          borderBottomColor: theme.colors.cardBorder,
          paddingTop: STATUSBAR_HEIGHT,
        },
      ]}
    >
      <View style={styles.inner}>
        {/* Left */}
        <View style={styles.side}>
          {showBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={theme.colors.brand} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={handleLogoPress}
              activeOpacity={0.7}
              style={[styles.logoIcon, { backgroundColor: isDark ? 'rgba(100,255,218,0.1)' : theme.colors.primaryContainer, borderColor: theme.colors.cardBorder }]}
            >
              <MaterialIcons name="security" size={20} color={theme.colors.brand} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center */}
        <Text style={[Typography.headlineMD, styles.title, { color: theme.colors.brand }]}>
          {title}
        </Text>

        {/* Right */}
        <View style={[styles.side, { justifyContent: 'flex-end', gap: 4 }]}>
          {showThemeToggle && (
            <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={22}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}
          {rightIcon && (
            <TouchableOpacity onPress={rightAction} style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name={rightIcon} size={22} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  side: {
    minWidth: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
