import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { API_URL, API_BASE_URL } from '../config';
import { useTheme } from '../theme';

export const LoginScreen = () => {
  const { colors, common, roundness, isDark, typography } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTelegramLogin, setShowTelegramLogin] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Please fill in all fields' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      await login(data.access_token, data.user);
      Toast.show({ type: 'success', text1: 'Login successful' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Login failed', text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramAuth = async (navState: any) => {
    if (navState.url.includes('/auth/callback?')) {
      setShowTelegramLogin(false);
      setLoading(true);

      try {
        const queryString = navState.url.split('?')[1];
        const params = Object.fromEntries(new URLSearchParams(queryString));

        const response = await fetch(`${API_URL}/auth/telegram-login-widget`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Telegram login failed');
        }

        await login(data.token, data.user);
        Toast.show({ type: 'success', text1: 'Welcome!', text2: 'Logged in via Telegram' });
      } catch (error: any) {
        Toast.show({ type: 'error', text1: 'Telegram login failed', text2: error.message });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={[styles.logoIcon, { backgroundColor: common.primary }]}>
                 <MaterialIcons name="bolt" size={48} color="#fff" />
              </View>
              <Text style={[styles.title, { color: colors.text, ...typography.h1, fontSize: 34 }]}>xend</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary, ...typography.bodyLarge, marginTop: -4 }]}>Secure Access</Text>
            </View>

            <View style={styles.form}>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MaterialIcons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text, ...typography.body }]}
                  placeholder="Business Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MaterialIcons name="lock-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text, ...typography.body }]}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: common.primary, borderRadius: roundness.lg }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.loginButtonText, typography.button, { color: '#fff', fontSize: 18 }]}>Sign In</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.line, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary, ...typography.label, fontSize: 10 }]}>SECURE ACCESS</Text>
                <View style={[styles.line, { backgroundColor: colors.border }]} />
              </View>

              <TouchableOpacity
                style={[styles.telegramButton, { borderRadius: roundness.lg }]}
                onPress={() => setShowTelegramLogin(true)}
                disabled={loading}
              >
                <MaterialIcons name="send" size={20} color="#fff" style={{ marginRight: 10 }} />
                <Text style={[styles.telegramButtonText, typography.body, { color: '#fff', fontSize: 16 }]}>Log in with Telegram</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
               <Text style={[styles.footerText, { color: colors.textSecondary, ...typography.caption, fontSize: 12 }]}>
                 Protected by xend Security
               </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <Modal
        visible={showTelegramLogin}
        animationType="slide"
        onRequestClose={() => setShowTelegramLogin(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => setShowTelegramLogin(false)} style={styles.modalCloseBtn}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text, ...typography.bodyLarge }]}>Telegram Authentication</Text>
            <View style={{ width: 44 }} />
          </View>
          <WebView
            source={{ uri: `${API_URL}/auth/telegram-login-widget-page?redirect_url=${API_BASE_URL}/auth/callback` }}
            onNavigationStateChange={handleTelegramAuth}
            startInLoadingState
            renderLoading={() => <ActivityIndicator style={styles.loader} size="large" color={common.primary} />}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: { flex: 1, padding: 32, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  logoIcon: {
     width: 80,
     height: 80,
     borderRadius: 24,
     alignItems: 'center',
     justifyContent: 'center',
     marginBottom: 16,
     elevation: 8,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.1,
     shadowRadius: 12,
  },
  title: {
    // Standardized via typography
  },
  subtitle: {
    // Standardized via typography
  },
  form: { width: '100%' },
  inputContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     borderWidth: 1,
     borderRadius: 16,
     marginBottom: 16,
     paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 18 },
  loginButton: {
     paddingVertical: 18,
     alignItems: 'center',
     marginTop: 10,
     elevation: 4,
  },
  loginButtonText: {
    // Standardized via typography
  },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 32 },
  line: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 16 },
  telegramButton: {
    backgroundColor: '#26A5E4',
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  telegramButtonText: {
    // Standardized via typography
  },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: {
    // Standardized via typography
  },
  modalHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  modalCloseBtn: { padding: 16 },
  modalTitle: {
    // Standardized via typography
  },
  loader: { position: 'absolute', top: '50%', left: '50%', marginLeft: -25, marginTop: -25 },
});
