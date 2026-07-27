import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme';

export const CreateTransactionScreen = ({ navigation }) => {
  const { colors, common } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payment</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}> 
          <MaterialIcons name="payments" size={48} color={common.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Payment flow unavailable</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>This build no longer uses terminal-based payment flows. Please continue through the main wallet and payment experience.</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: common.primary }]} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
     padding: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  card: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
  },
});
