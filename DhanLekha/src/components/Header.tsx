import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography } from '../theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSecurity } from '../context/SecurityContext';

export const Header = ({ title = 'DhanLekha', showBack = false, onBack, rightIcon, rightAction, showThemeToggle = false }: {
  title?: string; showBack?: boolean; onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap; rightAction?: () => void; showThemeToggle?: boolean;
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { shieldActive, toggleShield } = useSecurity();
  const insets = useSafeAreaInsets();
  
  const btnBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const paddingTop = insets.top;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.cardBorder, paddingTop }]}>
      <View style={styles.inner}>
        <View style={styles.side}>
          {showBack ? (
            <TouchableOpacity onPress={onBack} style={[styles.btn, { backgroundColor: btnBg }]} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color={theme.colors.onSurface} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={toggleShield}
              style={[styles.logo, { backgroundColor: (shieldActive ? theme.colors.accent : '#EF4444') + '15' }]} 
              activeOpacity={0.7}
            >
              <Ionicons 
                name={shieldActive ? "shield-checkmark" : "warning"} 
                size={18} 
                color={shieldActive ? theme.colors.accent : '#EF4444'} 
              />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, fontSize: 18, fontFamily: 'Manrope_800ExtraBold', flex: 1, textAlign: 'center' }]} numberOfLines={1}>
          {title}
        </Text>
        
        <View style={[styles.side, { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }]}>
          {showThemeToggle && (
            <TouchableOpacity onPress={toggleTheme} style={[styles.btn, { backgroundColor: btnBg }]} activeOpacity={0.7}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
          {rightIcon && (
            <TouchableOpacity onPress={rightAction} style={[styles.btn, { backgroundColor: btnBg }]} activeOpacity={0.7}>
              <Ionicons name={rightIcon} size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { 
    borderBottomWidth: 1, 
    zIndex: 100,
    elevation: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        // elevation already added
      }
    })
  },
  inner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 60, 
    paddingHorizontal: 16 
  },
  side: { width: 80, alignItems: 'center', flexDirection: 'row' },
  btn: { 
    width: 38, 
    height: 38, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)'
  },
  logo: { 
    width: 38, 
    height: 38, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
});
