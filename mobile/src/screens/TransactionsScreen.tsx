import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useQuery } from 'react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { API_URL } from '../config';
import { useTheme } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const api = {
  getTransactions: async (token: string | null) => {
    const response = await fetch(`${API_URL}/wallet/transactions`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },
};

export const TransactionsScreen = () => {
  const { colors, common, shadows, roundness, typography } = useTheme();
  const [token, setToken] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem('auth_token');
      setToken(storedToken);
    };
    loadToken();
  }, []);

  const { data, isLoading, refetch } = useQuery(['wallet-transactions', token], () => api.getTransactions(token), {
    enabled: !!token,
  });

  const transactionList = data?.items || data?.data || [];

  const filteredData = transactionList.filter((item: any) => {
    const incomeTypes = ['terminal_sale', 'top_up', 'credit', 'receive', 'usd_receive', 'admin_credit'];
    const expenseTypes = ['withdraw', 'disbursement', 'debit', 'send', 'usd_send', 'admin_debit', 'usdt_send'];

    const isIncome = incomeTypes.includes(item.transaction_type) || (item.amount > 0 && item.transaction_type === 'adjustment');
    const isExpense = expenseTypes.includes(item.transaction_type) || (item.amount < 0 && item.transaction_type === 'adjustment');

    if (filter === 'all') return true;
    if (filter === 'income') return isIncome;
    if (filter === 'expense') return isExpense;
    return true;
  });

  const renderItem = ({ item }: { item: any }) => {
    const expenseTypes = ['withdraw', 'disbursement', 'debit', 'send', 'usd_send', 'admin_debit', 'usdt_send'];
    const isNegative = expenseTypes.includes(item.transaction_type) || (item.amount < 0 && item.transaction_type === 'adjustment');

    return (
      <TouchableOpacity
        style={[
          styles.item,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: roundness.md,
            ...shadows.sm
          }
        ]}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: isNegative ? colors.background : colors.background }]}>
          <View style={[styles.iconInner, { backgroundColor: isNegative ? common.danger + '15' : common.success + '15' }]}>
            <MaterialIcons
              name={isNegative ? 'call-made' : 'call-received'}
              size={22}
              color={isNegative ? common.danger : common.success}
            />
          </View>
        </View>
        <View style={styles.left}>
          <Text style={[styles.desc, { color: colors.text, ...typography.body }]} numberOfLines={1}>
            {item.note || item.description || item.transaction_type.replace('_', ' ').toUpperCase()}
          </Text>
          <View style={styles.subLeft}>
            <Text style={[styles.date, { color: colors.textSecondary, ...typography.caption }]}>
              {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {item.reference_id && (
              <Text style={[styles.refText, { color: colors.textSecondary, backgroundColor: colors.surface, ...typography.label, fontSize: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }]}>
                #{item.reference_id.substring(0, 8)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.right}>
          <Text style={[styles.amount, { color: isNegative ? common.danger : common.success, ...typography.bodyLarge }]}>
            {isNegative ? '-' : '+'}₱{Math.abs(item.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: item.status === 'completed' ? common.success + '15' : common.warning + '15',
            }
          ]}>
            <Text style={[styles.statusText, { color: item.status === 'completed' ? common.success : common.warning, ...typography.label, fontSize: 9 }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ label, value }: { label: string, value: string }) => (
    <TouchableOpacity
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFilter(value);
      }}
      style={[
        styles.filterBtn,
        {
          backgroundColor: filter === value ? common.primary : colors.surface,
          borderColor: filter === value ? common.primary : colors.border
        }
      ]}
    >
      <Text style={[
        styles.filterText,
        { color: filter === value ? '#fff' : colors.textSecondary, ...typography.label, fontSize: 11 }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text, ...typography.h2 }]}>Activity</Text>
        <View style={styles.filterContainer}>
          <FilterButton label="All" value="all" />
          <FilterButton label="Income" value="income" />
          <FilterButton label="Expenses" value="expense" />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={common.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={common.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="receipt-long" size={48} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textSecondary, ...typography.body }]}>No transactions yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterText: {
    // Standardized via typography
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconInner: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  left: {
    flex: 1,
  },
  desc: {
    // Standardized via typography
  },
  date: {
    marginTop: 4,
  },
  subLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refText: {
    // Standardized via typography
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    // Standardized via typography
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  statusText: {
    // Standardized via typography
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    // Standardized via typography
  },
});
