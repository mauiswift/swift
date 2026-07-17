import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme';

export const SettingsScreen = () => {
  const { logout, user } = useAuth();
  const { colors, common, roundness, typography } = useTheme();

  const SettingItem = ({ icon, label, onPress, color, showArrow = true }: { icon: string, label: string, onPress?: () => void, color?: string, showArrow?: boolean }) => (
    <TouchableOpacity
      style={[styles.item, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={[styles.iconBox, { backgroundColor: (color || colors.text) + '10' }]}>
        <MaterialIcons name={icon} size={22} color={color || colors.text} />
      </View>
      <Text style={[styles.itemText, { color: color || colors.text, ...typography.body }]}>{label}</Text>
      {showArrow && <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text, ...typography.h2 }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderRadius: roundness.lg }]}>
           <View style={[styles.avatar, { backgroundColor: common.primary }]}>
              <Text style={[styles.avatarText, typography.h3, { color: '#fff' }]}>{user?.username?.substring(0, 1).toUpperCase() || 'P'}</Text>
           </View>
           <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text, ...typography.bodyLarge }]}>{user?.username || 'xend User'}</Text>
              <Text style={[styles.profileRole, { color: colors.textSecondary, ...typography.caption }]}>
                {user?.permissions?.is_super_admin ? 'Super Administrator' : 'Account User'}
              </Text>
           </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...typography.label }]}>Account</Text>
          <SettingItem icon="person-outline" label="Personal Information" />
          <SettingItem icon="security" label="Login & Security" />
          <SettingItem icon="notifications-none" label="Notifications" />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...typography.label }]}>System</Text>
          {user?.permissions?.is_super_admin && (
            <SettingItem
              icon="admin-panel-settings"
              label="System Logs"
              onPress={() => Alert.alert('System', 'No recent issues detected.')}
              color={common.primary}
            />
          )}
          <SettingItem icon="help-outline" label="Support Center" />
          <SettingItem icon="info-outline" label="About xend" />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...typography.label }]}>Danger Zone</Text>
          <SettingItem
            icon="logout"
            label="Log Out"
            onPress={logout}
            color={common.danger}
            showArrow={false}
          />
        </View>

        <Text style={[styles.versionText, { color: colors.textSecondary, ...typography.caption, fontSize: 11 }]}>xend v2.4.2-stable (Last Sync: 2024-05-26)</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
  },
  title: {
    // Standardized via typography
  },
  content: {
    padding: 24,
  },
  profileCard: {
     flexDirection: 'row',
     padding: 20,
     alignItems: 'center',
     marginBottom: 32,
  },
  avatar: {
     width: 60,
     height: 60,
     borderRadius: 30,
     alignItems: 'center',
     justifyContent: 'center',
  },
  avatarText: {
     // Standardized via typography
  },
  profileInfo: {
     marginLeft: 16,
  },
  profileName: {
     // Standardized via typography
  },
  profileRole: {
     marginTop: 2,
  },
  section: {
     marginBottom: 32,
  },
  sectionTitle: {
     marginBottom: 12,
     paddingLeft: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconBox: {
     width: 40,
     height: 40,
     borderRadius: 12,
     alignItems: 'center',
     justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    marginLeft: 14,
  },
  versionText: {
     textAlign: 'center',
     marginTop: 20,
     marginBottom: 40,
  }
});
