import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useQuery } from 'react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { API_URL } from '../config';
import { useTheme } from '../theme';

const { width } = Dimensions.get('window');

const api = {
  getBalance: async (token: string | null) => {
    const response = await fetch(`${API_URL}/wallet/balance?currency=PHP`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch balance');
    return response.json();
  },

  getTransactions: async (token: string | null) => {
    const response = await fetch(`${API_URL}/wallet/transactions?per_page=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },
};

const BalanceCard = ({ balance, currency, isLoading, navigation }: { balance: number, currency: string, isLoading: boolean, navigation: any }) => {
  const { colors, common, roundness, shadows, typography } = useTheme();

  return (
    <View style={[styles.balanceCard, { backgroundColor: colors.card, borderRadius: roundness.lg, ...shadows.md }]}>
      <View style={styles.balanceHeader}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary, ...typography.label }]}>Available Balance</Text>
        <View style={styles.verifiedBadge}>
          <MaterialIcons name="verified" size={14} color={common.success} />
          <Text style={[styles.verifiedText, { color: common.success, ...typography.label, fontSize: 10 }]}>VERIFIED</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={common.primary} style={{ alignSelf: 'flex-start', marginTop: 8 }} />
      ) : (
        <Text style={[styles.balanceAmount, { color: colors.text, ...typography.h1 }]}>
          {currency === 'PHP' ? '₱' : '$'}{balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>
      )}

      <View style={styles.balanceActions}>
        <TouchableOpacity
          style={[styles.balanceActionBtn, { backgroundColor: common.primary + '10' }]}
          onPress={() => navigation.navigate('Wallet', { action: 'topup' })}
        >
          <MaterialIcons name="add" size={20} color={common.primary} />
          <Text style={[styles.balanceActionText, { color: common.primary, ...typography.label, fontSize: 12 }]}>Top Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.balanceActionBtn, { backgroundColor: common.success + '10' }]}
          onPress={() => navigation.navigate('Wallet', { action: 'withdraw' })}
        >
          <MaterialIcons name="file-download" size={20} color={common.success} />
          <Text style={[styles.balanceActionText, { color: common.success, ...typography.label, fontSize: 12 }]}>Withdraw</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.balanceActionBtn, { backgroundColor: common.warning + '10' }]} onPress={() => navigation.navigate('Transactions')}>
          <MaterialIcons name="history" size={20} color={common.warning} />
          <Text style={[styles.balanceActionText, { color: common.warning, ...typography.label, fontSize: 12 }]}>Settlements</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const TrustBanner = () => {
  const { colors, roundness, typography } = useTheme();
  return (
    <View style={[styles.trustBanner, { backgroundColor: colors.surface, borderRadius: roundness.md }]}>
       <View style={styles.trustItem}>
          <MaterialIcons name="security" size={16} color={colors.textSecondary} />
          <Text style={[styles.trustText, { color: colors.textSecondary, ...typography.label, fontSize: 9 }]}>PCI-DSS</Text>
       </View>
       <View style={styles.trustDivider} />
       <View style={styles.trustItem}>
          <MaterialIcons name="verified-user" size={16} color={colors.textSecondary} />
          <Text style={[styles.trustText, { color: colors.textSecondary, ...typography.label, fontSize: 9 }]}>BSP REGULATED</Text>
       </View>
       <View style={styles.trustDivider} />
       <View style={styles.trustItem}>
          <MaterialIcons name="lock" size={16} color={colors.textSecondary} />
          <Text style={[styles.trustText, { color: colors.textSecondary, ...typography.label, fontSize: 9 }]}>ENCRYPTED</Text>
       </View>
    </View>
  );
};

const TransactionItem = ({ transaction }: { transaction: any }) => {
  const { colors, common, roundness, typography } = useTheme();
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'pending': return 'access-time';
      case 'failed': return 'cancel';
      default: return 'help-outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return common.success;
      case 'pending': return common.warning;
      case 'failed': return common.danger;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.transactionItem, { backgroundColor: colors.surface, borderRadius: roundness.md }]}>
      <View style={[styles.transactionIconContainer, { backgroundColor: colors.background }]}>
        <MaterialIcons
          name={getStatusIcon(transaction.status)}
          size={22}
          color={getStatusColor(transaction.status)}
        />
      </View>

      <View style={styles.transactionInfo}>
        <Text style={[styles.transactionDesc, { color: colors.text, ...typography.body }]} numberOfLines={1}>{transaction.description || transaction.note || transaction.transaction_type.replace('_', ' ').toUpperCase()}</Text>
        <Text style={[styles.transactionDate, { color: colors.textSecondary, ...typography.bodySmall, fontSize: 12 }]}>
          {new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, { color: colors.text, ...typography.bodyLarge }]}>₱{(Math.abs(transaction.amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
      </View>
    </View>
  );
};

const NavButton = ({ icon, label, onPress, color }: { icon: string, label: string, onPress: () => void, color: string }) => {
  const { colors, roundness, typography } = useTheme();
  return (
    <TouchableOpacity style={styles.navBtnItem} onPress={onPress}>
       <View style={[styles.navBtnIcon, { backgroundColor: color + '15', borderRadius: roundness.md }]}>
          <MaterialIcons name={icon} size={26} color={color} />
       </View>
       <Text style={[styles.navBtnLabel, { color: colors.text, ...typography.label, fontSize: 10 }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const { colors, common, isDark, typography, roundness } = useTheme();
  const [token, setToken] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem('auth_token');
      setToken(storedToken);
    };
    loadToken();
  }, []);

  const balanceQuery = useQuery(
    ['balance', token],
    () => api.getBalance(token),
    { enabled: !!token }
  );

  const transactionsQuery = useQuery(
    ['transactions', token],
    () => api.getTransactions(token),
    { enabled: !!token }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      balanceQuery.refetch(),
      transactionsQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [220, 140],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, { height: headerHeight, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.headerTitle, { color: colors.text, ...typography.h2, fontSize: 28 }]}>xend</Text>
              <MaterialIcons name="verified" size={20} color={common.primary} style={{ marginTop: 2, marginLeft: 8 }} />
            </View>
            <Animated.View style={[styles.statusRow, { opacity: headerOpacity }]}>
               <View style={[styles.statusDot, { backgroundColor: common.success }]} />
               <Text style={[styles.headerSubtitle, { color: colors.textSecondary, ...typography.label, fontSize: 10 }]}>BANK GRADE INFRASTRUCTURE</Text>
            </Animated.View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={[styles.profileBtn, { backgroundColor: colors.background }]}>
               <MaterialIcons name="notifications-none" size={26} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.profileBtn, { marginLeft: 10, backgroundColor: colors.background }]}>
               <MaterialIcons name="account-circle" size={26} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.navButtonsRow}>
           <NavButton icon="receipt-long" label="History" onPress={() => navigation.navigate('Transactions')} color={common.warning} />
           <NavButton icon="account-balance-wallet" label="Wallet" onPress={() => navigation.navigate('Wallet')} color={common.success} />
           <NavButton icon="settings" label="Settings" onPress={() => navigation.navigate('Settings')} color={common.secondary} />
           <NavButton icon="support-agent" label="Support" onPress={() => Alert.alert('Support', 'Connecting to xend Support Agent...')} color="#EC4899" />
        </View>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={common.primary}
          />
        }
      >
        <View style={styles.balanceContainer}>
          <BalanceCard
            balance={balanceQuery.data?.balance}
            currency={balanceQuery.data?.currency || 'PHP'}
            isLoading={balanceQuery.isLoading}
            navigation={navigation}
          />
        </View>

        <View style={styles.section}>
          <TrustBanner />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, ...typography.h3 }]}>Recent Activity</Text>
          </View>

          {transactionsQuery.isLoading && !transactionsQuery.data ? (
            <ActivityIndicator size="large" color={common.primary} style={{ marginVertical: 20 }} />
          ) : (transactionsQuery.data?.items?.length > 0 || transactionsQuery.data?.data?.length > 0) ? (
            <View style={styles.transactionsList}>
              {(transactionsQuery.data.items || transactionsQuery.data.data).slice(0, 5).map((item: any) => (
                <TransactionItem key={item.id} transaction={item} />
              ))}
              <TouchableOpacity
                style={[styles.viewAllBtn, { backgroundColor: colors.surface, borderRadius: roundness.md }]}
                onPress={() => navigation.navigate('Transactions')}
                activeOpacity={0.6}
              >
                 <Text style={[styles.viewAllText, { color: common.primary, ...typography.label, fontSize: 13 }]}>View All Transactions</Text>
                 <MaterialIcons name="arrow-forward" size={18} color={common.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="receipt" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: colors.text, ...typography.body }]}>No transactions yet</Text>
            </View>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 16,
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    // Standardized via typography
  },
  headerSubtitle: {
    // Standardized via typography
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  headerRight: {
    flexDirection: 'row',
  },
  profileBtn: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: 'rgba(255,255,255,0.15)',
     alignItems: 'center',
     justifyContent: 'center',
  },
  balanceContainer: {
    paddingHorizontal: 24,
    marginTop: -30, // Pull up over the header
  },
  balanceCard: {
    padding: 20,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    // Standardized via typography
  },
  balanceAmount: {
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    marginLeft: 4,
  },
  balanceActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  balanceActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  balanceActionText: {
    marginLeft: 6,
  },
  trustBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 24,
    alignItems: 'center',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    // Standardized via typography
  },
  trustDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    // Standardized via typography
  },
  transactionsList: {
    paddingHorizontal: 24,
    gap: 12,
    paddingBottom: 24,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    // Standardized via typography
  },
  transactionDate: {
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    // Standardized via typography
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 24,
    borderRadius: 20,
  },
  emptyStateText: {
    marginTop: 12,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 8,
  },
  viewAllText: {
    marginRight: 8,
  },
  navButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 10,
  },
  navBtnItem: {
    alignItems: 'center',
    width: (width - 48) / 4,
  },
  navBtnIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  navBtnLabel: {
    // Standardized via typography
  }
});
