import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Language, TRANSLATIONS } from '../constants/translations';
import { getSavedLanguage, saveLanguage } from '../utils/languageStorage';

type Role = 'farmer' | 'admin';

export default function HomeScreen() {
  const [role, setRole] = useState<Role>('farmer');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    getSavedLanguage().then((saved) => {
      setLanguage(saved);
    });
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    saveLanguage(lang);
  };

  const handleLogin = async () => {
    console.log('LOGIN BUTTON PRESSED');
    console.log('Role:', role);
    console.log('Phone:', phone);
    console.log('Language:', language);

    if (!phone || !password) {
      Alert.alert(
        language === 'ta' ? 'தகவல் தேவை' : 'Missing information',
        language === 'ta'
          ? 'உங்கள் தொலைபேசி எண் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.'
          : 'Please enter your phone number and password.'
      );
      return;
    }

    await saveLanguage(language);

    if (role === 'farmer') {
      router.push('/farmer');
    } else {
      router.push('/admin');
    }
  };

  const t = TRANSLATIONS[language];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>C</Text>
          </View>

          <Text style={styles.brandName}>CHLORIS</Text>

          <Text style={styles.tagline}>
            Smart Farming. Smarter Decisions.
          </Text>

          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>
              {language === 'ta' ? 'நல்வரவு' : 'Welcome back'}
            </Text>

            <Text style={styles.welcomeSubtitle}>
              {language === 'ta'
                ? 'உங்கள் வயல் மற்றும் பயிர் நிலையை கண்காணிக்க உள்நுழையவும்.'
                : 'Sign in to monitor your field and crop health.'}
            </Text>
          </View>

          {/* LANGUAGE PREFERENCE SECTION */}
          <View style={styles.languageContainer}>
            <Text style={styles.sectionLabel}>
              {t.languagePrompt.toUpperCase()}
            </Text>

            <View style={styles.languageRow}>
              <Pressable
                style={[
                  styles.languageButton,
                  language === 'en' && styles.languageButtonActive,
                ]}
                onPress={() => handleLanguageChange('en')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    language === 'en' && styles.languageButtonTextActive,
                  ]}
                >
                  English 🇬🇧
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.languageButton,
                  language === 'ta' && styles.languageButtonActive,
                ]}
                onPress={() => handleLanguageChange('ta')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    language === 'ta' && styles.languageButtonTextActive,
                  ]}
                >
                  தமிழ் 🇮🇳
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ROLE CONTAINER */}
          <View style={styles.roleContainer}>
            <Text style={styles.sectionLabel}>
              {language === 'ta' ? 'உள்நுழைவு வகை' : 'LOGIN AS'}
            </Text>

            <View style={styles.roleRow}>
              <Pressable
                style={[
                  styles.roleButton,
                  role === 'farmer' && styles.roleButtonActive,
                ]}
                onPress={() => setRole('farmer')}
              >
                <Text style={styles.roleIcon}>🌾</Text>

                <View>
                  <Text
                    style={[
                      styles.roleTitle,
                      role === 'farmer' && styles.roleTitleActive,
                    ]}
                  >
                    {language === 'ta' ? 'விவசாயி' : 'Farmer'}
                  </Text>

                  <Text style={styles.roleDescription}>
                    {language === 'ta' ? 'எளிய வயல் விவரங்கள்' : 'Simple field insights'}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.roleButton,
                  role === 'admin' && styles.roleButtonActive,
                ]}
                onPress={() => setRole('admin')}
              >
                <Text style={styles.roleIcon}>⚙️</Text>

                <View>
                  <Text
                    style={[
                      styles.roleTitle,
                      role === 'admin' && styles.roleTitleActive,
                    ]}
                  >
                    Admin
                  </Text>

                  <Text style={styles.roleDescription}>
                    {language === 'ta' ? 'விரிவான கண்காணிப்பு' : 'Detailed monitoring'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <Text style={styles.inputLabel}>
              {language === 'ta' ? 'தொலைபேசி எண்' : 'Phone Number'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={language === 'ta' ? 'தொலைபேசி எண்ணை உள்ளிடவும்' : 'Enter your phone number'}
              placeholderTextColor="#8A8F98"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.inputLabel}>
              {language === 'ta' ? 'கடவுச்சொல்' : 'Password'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={language === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும்' : 'Enter your password'}
              placeholderTextColor="#8A8F98"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Pressable
              onPress={() =>
                Alert.alert(
                  language === 'ta' ? 'விரைவில்' : 'Coming soon',
                  language === 'ta' ? 'கடவுச்சொல் மீட்பு விரைவில் சேர்க்கப்படும்.' : 'Password recovery will be added later.'
                )
              }
            >
              <Text style={styles.forgotPassword}>
                {language === 'ta' ? 'கடவுச்சொல் மறந்துவிட்டதா?' : 'Forgot password?'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>
                {language === 'ta' ? 'உள்நுழைக' : 'LOGIN'}
              </Text>

              <Text style={styles.arrow}>
                →
              </Text>
            </Pressable>
          </View>

          <View style={styles.bottomSection}>
            <Text style={styles.bottomText}>
              Field-deployable • Cloud-independent • Smart
            </Text>

            <Text style={styles.version}>
              CHLORIS • SIH 2026
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9F5',
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 30,
  },

  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2F6B45',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },

  brandName: {
    textAlign: 'center',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#173B27',
    marginTop: 14,
  },

  tagline: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6B756D',
    marginTop: 5,
  },

  welcomeSection: {
    marginTop: 32,
    marginBottom: 20,
  },

  welcomeTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#17231B',
  },

  welcomeSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#68716A',
    marginTop: 7,
  },

  languageContainer: {
    marginBottom: 20,
  },

  languageRow: {
    flexDirection: 'row',
    gap: 10,
  },

  languageButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE3DD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  languageButtonActive: {
    borderColor: '#2F6B45',
    backgroundColor: '#EAF3EC',
  },

  languageButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#49524B',
  },

  languageButtonTextActive: {
    color: '#245A38',
  },

  roleContainer: {
    marginBottom: 24,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#68716A',
    marginBottom: 10,
  },

  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },

  roleButton: {
    flex: 1,
    minHeight: 78,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE3DD',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  roleButtonActive: {
    borderColor: '#2F6B45',
    backgroundColor: '#EAF3EC',
  },

  roleIcon: {
    fontSize: 24,
  },

  roleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#29332C',
  },

  roleTitleActive: {
    color: '#245A38',
  },

  roleDescription: {
    fontSize: 10,
    color: '#7A817B',
    marginTop: 3,
  },

  form: {
    width: '100%',
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#29332C',
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D7DED8',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#17231B',
  },

  forgotPassword: {
    textAlign: 'right',
    color: '#2F6B45',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },

  loginButton: {
    height: 55,
    borderRadius: 14,
    backgroundColor: '#2F6B45',
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },

  arrow: {
    color: '#FFFFFF',
    fontSize: 22,
    marginLeft: 12,
  },

  bottomSection: {
    marginTop: 40,
    paddingTop: 20,
    alignItems: 'center',
  },

  bottomText: {
    color: '#788179',
    fontSize: 11,
    textAlign: 'center',
  },

  version: {
    color: '#A0A7A1',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 8,
  },
});