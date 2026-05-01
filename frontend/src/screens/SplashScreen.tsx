import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography } from '../theme/typography';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const { theme, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
      Animated.timing(textFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(progressAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
    ]).start(() => {
      setTimeout(onFinish, 300);
    });
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={isDark ? ['#0A192F', '#101415', '#0B0F10'] : ['#EFF6FF', '#F0FDFA', '#F8FAFC']}
      style={styles.container}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {/* Glow orb */}
      <View
        style={[
          styles.glowOrb,
          { backgroundColor: isDark ? 'rgba(100,255,218,0.06)' : 'rgba(20,184,166,0.08)' },
        ]}
      />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Logo */}
        <View
          style={[
            styles.logoContainer,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(10,25,47,0.08)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(10,25,47,0.12)',
            },
          ]}
        >
          <MaterialIcons name="shield" size={52} color={isDark ? '#64FFDA' : '#0A192F'} />
        </View>

        <Animated.View style={{ opacity: textFade, alignItems: 'center' }}>
          <Text style={[Typography.displayXL, styles.appName, { color: isDark ? '#64FFDA' : '#0A192F' }]}>
            DhanLekha
          </Text>
          <Text
            style={[
              Typography.labelSM,
              styles.tagline,
              { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(10,25,47,0.5)', letterSpacing: 2.5 },
            ]}
          >
            WEALTH VAULT
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Progress bar */}
      <Animated.View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressWidth,
              backgroundColor: isDark ? '#64FFDA' : '#0A192F',
            },
          ]}
        />
      </Animated.View>

      <Text style={[Typography.labelSM, styles.vaultText, { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(10,25,47,0.35)' }]}>
        SECURING YOUR VAULT
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOrb: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    top: '20%',
    left: '10%',
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    textAlign: 'center',
    marginTop: 8,
  },
  tagline: {
    marginTop: 6,
    textTransform: 'uppercase',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 80,
    width: 180,
    height: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  vaultText: {
    position: 'absolute',
    bottom: 55,
    letterSpacing: 2,
  },
});
