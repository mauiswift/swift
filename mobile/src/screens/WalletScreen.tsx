import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useQuery, useMutation } from 'react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { API_URL } from '../config';
import { useTheme } from '../theme';
import { useAuth } from '../contexts/AuthContext';

const api = {
  getBalance: async (token: string | null) => {
    const response = await fetch(`${API_URL}/wallet/balance`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch balance');
    return response.json();
  },
  withdraw: async (token: string | null, data: any) => {
    const response = await fetch(`${API_URL}/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Withdrawal failed');
    }
    return response.json();
  },
  requestTopup: async (token: string | null, data: any) => {
    const response = await fetch(`${API_URL}/topup/swiftpay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Top-up request failed');
    }
    return response.json();
  },
  getInstitutions: async (token: string | null) => {
    const response = await fetch(`${API_URL}/swiftpay/institutions`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch institutions');
    return response.json();
  }
};

export const WalletScreen = ({ navigation, route }: any) => {
  const { colors, common, shadows, roundness, typography } = useTheme();
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [note, setNote] = useState('');
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');

  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const [showBankPicker, setShowBankPicker] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem('auth_token');
      setToken(storedToken);
    };
    loadToken();
  }, []);

  useEffect(() => {
    if (route.params?.action === 'topup') {
      setShowTopupModal(true);
    } else if (route.params?.action === 'withdraw') {
      // Focus withdrawal section if needed, for now just navigates
    }
  }, [route.params]);

  const balanceQuery = useQuery(['balance', token], () => api.getBalance(token), {
    enabled: !!token,
  });

  const institutionsQuery = useQuery(['institutions', token], () => api.getInstitutions(token), {
    enabled: !!token,
  });

  const topupMutation = useMutation((data: any) => api.requestTopup(token, data), {
    onSuccess: (data) => {
      setShowTopupModal(false);
      setTopupAmount('');
      if (data.redirect_url) {
        navigation.navigate('PaymentWebView', {
          url: data.redirect_url,
          title: 'SwiftPay Top-up'
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Top-up initiated successfully',
        });
      }
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
    }
  });

  const handleWithdraw = () => {
    if (!amount || !bankCode || !accountNumber) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all required fields',
      });
      return;
    }
    setPin('');
    setShowPinModal(true);
  };

  const executeWithdraw = async () => {
    if (pin.length < 4) {
      Toast.show({ type: 'error', text1: 'Enter valid PIN' });
      return;
    }
    setPinLoading(true);
    try {
      await api.withdraw(token, {
        amount: parseFloat(amount),
        bank_name: bankCode,
        account_number: accountNumber,
        note: note,
        pin: pin
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Withdrawal request submitted for approval',
      });
      setAmount('');
      setBankName('');
      setBankCode('');
      setAccountNumber('');
      setNote('');
      setShowPinModal(false);
      balanceQuery.refetch();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
      setPin('');
    } finally {
      setPinLoading(false);
    }
  };

  const handleTopup = () => {
    if (!topupAmount || isNaN(parseFloat(topupAmount))) {
      Toast.show({ type: 'error', text1: 'Invalid amount' });
      return;
    }
    topupMutation.mutate({ amount: parseFloat(topupAmount) });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={balanceQuery.isLoading}
            onRefresh={() => balanceQuery.refetch()}
            tintColor={common.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, ...typography.h2 }]}>My Wallet</Text>
        </View>

        <View style={[styles.balanceCard, { backgroundColor: common.primary, ...shadows.md }]}>
           <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.balanceLabel, typography.label]}>OPERATIONAL LIQUIDITY</Text>
                <View style={styles.verifiedRow}>
                   <MaterialIcons name="verified" size={12} color="#fff" />
                   <Text style={[styles.verifiedText, typography.label, { fontSize: 9 }]}>TRUSTED NODE</Text>
                </View>
              </View>
              <MaterialIcons name="security" size={28} color="rgba(255,255,255,0.4)" />
           </View>
          <Text style={[styles.balanceAmount, typography.h1, { fontSize: 42, color: '#fff' }]}>
            ₱{balanceQuery.data?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </Text>
          <View style={styles.cardFooter}>
             <View>
               <Text style={[styles.cardLabel, typography.label, { fontSize: 8 }]}>ACCOUNT HOLDER</Text>
               <Text style={[styles.cardHolder, typography.bodySmall, { fontWeight: '800', color: '#fff' }]}>{user?.name?.toUpperCase() || (user?.username?.toUpperCase()) || 'PAYBOT OPERATOR'}</Text>
             </View>
             <View style={{ alignItems: 'flex-end' }}>
               <Text style={[styles.cardLabel, typography.label, { fontSize: 8 }]}>NODE ID</Text>
               <Text style={[styles.cardNumber, { color: '#fff' }]}>{user?.id?.toString().padStart(8, '0') || '00000000'}</Text>
             </View>
          </View>
        </View>

        <View style={styles.complianceBanner}>
           <View style={styles.complianceItem}>
              <MaterialIcons name="gavel" size={14} color={colors.textSecondary} />
              <Text style={[styles.complianceText, typography.label, { fontSize: 9, color: colors.textSecondary }]}>BSP REGULATED</Text>
           </View>
           <View style={styles.complianceDivider} />
           <View style={styles.complianceItem}>
              <MaterialIcons name="security" size={14} color={colors.textSecondary} />
              <Text style={[styles.complianceText, typography.label, { fontSize: 9, color: colors.textSecondary }]}>PCI-DSS COMPLIANT</Text>
           </View>
        </View>

        <View style={styles.quickActions}>
           <TouchableOpacity style={styles.actionBtn} onPress={() => setShowTopupModal(true)}>
              <View style={[styles.actionIcon, { backgroundColor: common.primary + '15' }]}>
                 <MaterialIcons name="add-circle-outline" size={28} color={common.primary} />
              </View>
              <Text style={[styles.actionText, typography.label, { fontSize: 11, color: colors.text }]}>Add Funds</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Bank Transfer', 'Internal inter-bank transfers are processed via InstaPay/PESONet.')}>
              <View style={[styles.actionIcon, { backgroundColor: common.success + '15' }]}>
                 <MaterialIcons name="account-balance" size={26} color={common.success} />
              </View>
              <Text style={[styles.actionText, typography.label, { fontSize: 11, color: colors.text }]}>Transfers</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Settlements', 'Your terminal settlements are processed daily at 00:00 UTC.')}>
              <View style={[styles.actionIcon, { backgroundColor: common.warning + '15' }]}>
                 <MaterialIcons name="update" size={26} color={common.warning} />
              </View>
              <Text style={[styles.actionText, typography.label, { fontSize: 11, color: colors.text }]}>Settlements</Text>
           </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: 20, paddingTop: 30 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.h3 }]}>Withdraw Funds</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary, ...typography.label }]}>Amount (PHP)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
               <Text style={[styles.currencyPrefix, { color: colors.textSecondary, ...typography.bodyLarge }]}>₱</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderWidth: 0, ...typography.body }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary, ...typography.label }]}>Destination Bank / E-Wallet</Text>
            <TouchableOpacity
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: 'center' }]}
              onPress={() => setShowBankPicker(true)}
            >
               <Text style={{ color: bankName ? colors.text : colors.textSecondary, ...typography.body }}>
                 {bankName || "Select Bank / E-Wallet"}
               </Text>
               <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSecondary} style={{ position: 'absolute', right: 16 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary, ...typography.label }]}>Account Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, ...typography.body }]}
              placeholder="Enter account number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={accountNumber}
              onChangeText={setAccountNumber}
            />
          </View>

          <TouchableOpacity
            style={[styles.withdrawButton, { backgroundColor: common.primary }]}
            onPress={handleWithdraw}
            disabled={pinLoading}
          >
            {pinLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.withdrawButtonText, typography.button, { color: '#fff' }]}>Confirm Withdrawal</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Topup Modal */}
      <Modal
        visible={showTopupModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTopupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text, ...typography.h3 }]}>Request Top-up</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary, ...typography.bodySmall }]}>
              Enter the amount you wish to add to your wallet.
            </Text>

            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 20 }]}>
               <Text style={[styles.currencyPrefix, { color: colors.textSecondary, ...typography.bodyLarge }]}>₱</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderWidth: 0, ...typography.body }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={topupAmount}
                  onChangeText={setTopupAmount}
                  autoFocus
                />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.surface }]}
                onPress={() => setShowTopupModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.text, ...typography.button, fontSize: 15 }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: common.primary }]}
                onPress={handleTopup}
              >
                <Text style={[styles.modalBtnText, { color: '#fff', ...typography.button, fontSize: 15 }]}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PIN Modal */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
               <View style={[styles.actionIcon, { backgroundColor: colors.surface, marginBottom: 12 }]}>
                  <MaterialIcons name="lock-outline" size={32} color={common.primary} />
               </View>
               <Text style={[styles.modalTitle, { color: colors.text, ...typography.h3 }]}>Confirm Transaction</Text>
               <Text style={[styles.modalSubtitle, { color: colors.textSecondary, textAlign: 'center', ...typography.bodySmall }]}>
                 Please enter your security PIN to authorize this withdrawal.
               </Text>
            </View>

            <TextInput
              style={[styles.pinInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="••••"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              value={pin}
              onChangeText={setPin}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.surface }]}
                onPress={() => setShowPinModal(false)}
                disabled={pinLoading}
              >
                <Text style={[styles.modalBtnText, { color: colors.text, ...typography.button, fontSize: 15 }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: common.primary }]}
                onPress={executeWithdraw}
                disabled={pinLoading || pin.length < 4}
              >
                {pinLoading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.modalBtnText, { color: '#fff', ...typography.button, fontSize: 15 }]}>Authorize</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bank Picker Modal */}
      <Modal
        visible={showBankPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBankPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.modalTitle, { color: colors.text, ...typography.h3 }]}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {institutionsQuery.isLoading ? (
              <ActivityIndicator size="large" color={common.primary} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {(institutionsQuery.data?.data || []).map((bank: any) => (
                  <TouchableOpacity
                    key={bank.code}
                    style={[styles.bankItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setBankName(bank.name);
                      setBankCode(bank.code);
                      setShowBankPicker(false);
                    }}
                  >
                    <Text style={{ color: colors.text, ...typography.body }}>{bank.name}</Text>
                    {bankCode === bank.code && <MaterialIcons name="check" size={20} color={common.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
  },
  title: {
    // Standardized via typography
  },
  balanceCard: {
    margin: 20,
    padding: 24,
    borderRadius: 24,
    height: 200,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  verifiedText: {
    color: '#fff',
    marginLeft: 4,
  },
  balanceAmount: {
    // Standardized via typography
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 2,
  },
  cardNumber: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  cardHolder: {
    // Standardized via typography
  },
  complianceBanner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 20,
    gap: 12,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  complianceText: {
    // Standardized via typography
  },
  complianceDivider: {
    width: 1,
    height: 10,
    backgroundColor: '#CBD5E1',
  },
  quickActions: {
     flexDirection: 'row',
     justifyContent: 'space-around',
     paddingHorizontal: 20,
     marginTop: 10,
  },
  actionBtn: {
     alignItems: 'center',
  },
  actionIcon: {
     width: 56,
     height: 56,
     borderRadius: 16,
     alignItems: 'center',
     justifyContent: 'center',
     marginBottom: 8,
  },
  actionText: {
     // Standardized via typography
  },
  section: {
    padding: 24,
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 10,
  },
  inputWrapper: {
     flexDirection: 'row',
     alignItems: 'center',
     borderWidth: 1,
     borderRadius: 16,
     paddingHorizontal: 16,
  },
  currencyPrefix: {
     marginRight: 8,
  },
  input: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  withdrawButton: {
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  withdrawButtonText: {
    // Standardized via typography
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    padding: 24,
    borderRadius: 24,
    elevation: 20,
  },
  modalSubtitle: {
    marginTop: 8,
    lineHeight: 20,
  },
  modalTitle: {
    // Standardized via typography
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalBtnText: {
    // Standardized via typography
  },
  pinInput: {
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 10,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bankItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
