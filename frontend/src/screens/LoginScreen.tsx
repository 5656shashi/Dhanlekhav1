import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform as RNPlatform,
  InputAccessoryView,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  LayoutAnimation,
  UIManager,
} from 'react-native';

if (RNPlatform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const GREETINGS = [
  { text: 'Hello', lang: 'ENGLISH' },
  { text: 'नमस्ते', lang: 'HINDI' },
  { text: 'ನಮಸ್ಕಾರ', lang: 'KANNADA' },
  { text: 'నమస్కారం', lang: 'TELUGU' },
  { text: 'வணக்கம்', lang: 'TAMIL' },
  { text: 'നമസ്കാരം', lang: 'MALAYALAM' },
  { text: 'નમસ્તે', lang: 'GUJARATI' },
  { text: 'नमस्कार', lang: 'MARATHI' },
  { text: 'নমস্কার', lang: 'BENGALI' },
  { text: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ', lang: 'PUNJABI' },
];

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const { theme, isDark } = useTheme();
  const { login, sendOTP } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const INPUT_ACCESSORY_ID = "login_phone_input";

  const [greetingIdx, setGreetingIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Reset
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    scaleAnim.setValue(0.95);

    // Animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 15,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setGreetingIdx((prev) => (prev + 1) % GREETINGS.length);
        });
      }, 2500);
      return () => clearTimeout(timer);
    });
  }, [greetingIdx]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      RNPlatform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(true);
      }
    );
    const hideSubscription = Keyboard.addListener(
      RNPlatform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(false);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleBiometricAuth = async () => {
    if (isRegistering) {
      handleRegister();
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Wealth Vault',
        fallbackLabel: 'Enter PIN',
      });

      if (result.success) {
        try {
          setIsLoading(true);
          await login('+91' + phoneNumber, '123456');
          onLogin();
        } catch (error) {
          console.error('Login failed:', error);
          Alert.alert('Login Failed', 'Unable to authenticate. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      try {
        setIsLoading(true);
        await login('+91' + phoneNumber, '123456');
        onLogin();
      } catch (e) {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRegister = async () => {
    try {
      setIsLoading(true);
      await sendOTP('+91' + phoneNumber);
      Alert.alert('OTP Sent', `A verification code has been sent to +91${phoneNumber}`, [
        { text: 'OK', onPress: async () => {
          // For demo, immediately login after "OTP Sent"
          await login('+91' + phoneNumber, '123456');
          onLogin();
        }}
      ]);
    } catch (error) {
      Alert.alert('Registration Failed', 'Could not start registration. Please check your network.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={isDark ? ['#0A192F', '#060E1A'] : ['#F8FAFC', '#EFF6FF']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <ScrollView 
            contentContainerStyle={styles.content} 
            bounces={false} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <View style={[styles.topSection, isKeyboardVisible && { marginTop: 20 }]}>
            {!isKeyboardVisible && (
              <View style={styles.greetingWrapper}>
                  <Animated.View 
                    style={[
                      styles.greetingContainer, 
                      { 
                        opacity: fadeAnim,
                        transform: [
                          { translateY: slideAnim },
                          { scale: scaleAnim }
                        ]
                      }
                    ]}
                  >
                    <Text 
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[styles.greetingText, { color: theme.colors.onSurface }]}
                    >
                      {GREETINGS[greetingIdx].text}
                    </Text>
                  </Animated.View>
              </View>
            )}
            
            <Text style={[Typography.headlineMD, styles.subText, { color: theme.colors.onSurfaceVariant, marginTop: isKeyboardVisible ? 10 : 30 }]}>
              {isRegistering 
                ? 'Create your sovereign wealth vault and secure your legacy.' 
                : 'Securely access your wealth vault and legacy assets.'}
            </Text>
          </View>

          <View style={styles.bottomSection}>
            <View style={[
              styles.inputWrapper, 
              { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
                borderColor: isFocused ? theme.colors.brand : theme.colors.cardBorder,
                borderWidth: isFocused ? 1.5 : 1,
                paddingVertical: 4
              }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 12, borderRightWidth: 1, borderRightColor: theme.colors.cardBorder }}>
                <Ionicons name="call-outline" size={20} color={isFocused ? theme.colors.brand : theme.colors.onSurfaceVariant} style={{ marginRight: 8 }} />
                <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontWeight: '600' }]}>+91</Text>
              </View>
              <TextInput
                style={[Typography.bodyMD, { color: theme.colors.onSurface, flex: 1, paddingVertical: 14, paddingHorizontal: 16, fontSize: 18, fontWeight: '600', letterSpacing: 1 }]}
                placeholder="Phone Number"
                placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                maxLength={10}
                inputAccessoryViewID={INPUT_ACCESSORY_ID}
              />
            </View>

            <TouchableOpacity
              style={[styles.authBtn, { backgroundColor: theme.colors.accent, opacity: isLoading ? 0.7 : 1 }]}
              onPress={handleBiometricAuth}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Ionicons name={isRegistering ? "person-add-outline" : "finger-print-outline"} size={24} color={isDark ? '#0A192F' : '#FFFFFF'} />
              <Text style={[Typography.bodyMD, styles.authBtnText, { color: isDark ? '#0A192F' : '#FFFFFF' }]}>
                {isRegistering ? 'Register Account' : 'Sign in with Biometrics'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pinBtn, { borderColor: theme.colors.cardBorder }]}
              onPress={() => setIsRegistering(!isRegistering)}
            >
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, letterSpacing: 1 }]}>
                {isRegistering ? 'ALREADY HAVE AN ACCOUNT? LOGIN' : 'NEW TO DHANLEKHA? SIGN UP'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Ionicons name="shield-checkmark" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[Typography.labelSM, styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
              END-TO-END ENCRYPTED
            </Text>
          </View>
        </ScrollView>
        </TouchableWithoutFeedback>
      </SafeAreaView>

      {RNPlatform.OS === 'ios' && (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          <View style={[styles.accessoryView, { backgroundColor: isDark ? '#112240' : '#FFFFFF', borderTopColor: theme.colors.cardBorder }]}>
            <TouchableOpacity 
              onPress={() => Keyboard.dismiss()} 
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.brand} />
              <Text style={[Typography.labelLG, { color: theme.colors.brand, fontWeight: '700' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  topSection: {
    marginTop: height * 0.15,
    alignItems: 'center',
  },
  greetingWrapper: {
    height: 180,
    width: width - 64,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  greetingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 72,
    fontWeight: '800',
    letterSpacing: -2,
    textAlign: 'center',
    width: '100%',
  },
  subText: {
    fontWeight: '400',
    fontSize: 18,
    lineHeight: 28,
    maxWidth: '90%',
    marginTop: 30,
    textAlign: 'center',
  },
  bottomSection: {
    gap: 16,
    marginBottom: 40,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  authBtnText: {
    fontWeight: '700',
    fontSize: 16,
  },
  pinBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.5,
  },
  footerText: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
  accessoryView: {
    alignItems: 'flex-end', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  }
});
