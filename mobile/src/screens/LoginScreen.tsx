import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import { useTheme } from '../theme';

const WEB_LOGIN_URL = 'https://swiftpay.site/login';

const authBridgeScript = `
(function () {
  let sentToken = '';
  const sendToken = async () => {
    const token = window.localStorage.getItem('auth_token');
    if (!token || token === sentToken) return;
    try {
      const response = await fetch('/api/v1/auth/me', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!response.ok) return;
      window.ReactNativeWebView.postMessage(JSON.stringify({ token }));
      sentToken = token;
    } catch (_) {}
  };
  void sendToken();
  const timer = window.setInterval(sendToken, 500);
  window.setTimeout(() => window.clearInterval(timer), 120000);
})();
true;
`;

export const LoginScreen = () => {
  const { colors, common, roundness, isDark, typography } = useTheme();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showWebLogin, setShowWebLogin] = useState(false);

  const handleLogin = () => setShowWebLogin(true);

  const handleTelegramAuth = async (event: any) => {
    let message: { token?: string };
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (!message.token) return;

    setShowWebLogin(false);
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${message.token}` },
      });
      const userData = await response.json();
      if (!response.ok) {
        throw new Error(userData.detail || 'Sign-in failed');
      }
      await login(message.token, userData);
      Toast.show({ type: 'success', text1: 'Welcome!', text2: 'Sign-in complete' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Sign-in failed', text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={24}
      >
        <View style={styles.header}>
          <View style={[styles.logoIcon, { backgroundColor: common.primary }]}>
             <MaterialIcons name="bolt" size={48} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.text, ...typography.h1, fontSize: 34 }]}>xend</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, ...typography.bodyLarge, marginTop: -4 }]}>Secure Access</Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: common.primary, borderRadius: roundness.lg }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={[styles.loginButtonText, typography.button, { color: '#fff', fontSize: 18 }]}>Continue to sign in</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
           <Text style={[styles.footerText, { color: colors.textSecondary, ...typography.caption, fontSize: 12 }]}>
             Protected by xend Security
           </Text>
        </View>
      </KeyboardAwareScrollView>

      <Modal
        visible={showWebLogin}
        animationType="slide"
        onRequestClose={() => setShowWebLogin(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => setShowWebLogin(false)} style={styles.modalCloseBtn}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text, ...typography.bodyLarge }]}>SwiftPay Sign In</Text>
            <View style={{ width: 44 }} />
          </View>
          <WebView
            source={{ uri: WEB_LOGIN_URL }}
            injectedJavaScript={authBridgeScript}
            onMessage={handleTelegramAuth}
            originWhitelist={['https://swiftpay.site', 'https://kr.swiftpay.site', 'https://api.swiftpay.site', 'https://oauth.telegram.org', 'https://telegram.org', 'https://accounts.google.com']}
            setSupportMultipleWindows={false}
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
  scrollContent: { flexGrow: 1, padding: 32, justifyContent: 'center' },
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
