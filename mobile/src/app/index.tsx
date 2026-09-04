import React, { useState } from 'react';
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

type Role = 'farmer' | 'admin';

export default function HomeScreen() {
  const [role, setRole] = useState<Role>('farmer');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

const handleLogin = () => {
  console.log('LOGIN BUTTON PRESSED');
  console.log('Role:', role);
  console.log('Phone:', phone);
  console.log('Password entered:', password.length > 0);

  if (!phone || !password) {
    Alert.alert(
      'Missing information',
      'Please enter your phone number and password.'
    );
    return;
  }

  if (role === 'farmer') {
  router.push('/farmer');
} else {
  router.push('/admin');
}
};

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
              Welcome back
            </Text>

            <Text style={styles.welcomeSubtitle}>
              Sign in to monitor your field and crop health.
            </Text>
          </View>

          <View style={styles.roleContainer}>
            <Text style={styles.sectionLabel}>
              LOGIN AS
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
                    Farmer
                  </Text>

                  <Text style={styles.roleDescription}>
                    Simple field insights
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
                    Detailed monitoring
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          <View style={styles.form}>
            <Text style={styles.inputLabel}>
              Phone Number
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#8A8F98"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.inputLabel}>
              Password
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#8A8F98"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Pressable
              onPress={() =>
                Alert.alert(
                  'Coming soon',
                  'Password recovery will be added later.'
                )
              }
            >
              <Text style={styles.forgotPassword}>
                Forgot password?
              </Text>
            </Pressable>

            <Pressable
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>
                LOGIN
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
    marginTop: 42,
    marginBottom: 24,
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