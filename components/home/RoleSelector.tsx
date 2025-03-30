import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';

type UserType = 'borrower' | 'lender';

interface RoleSelectorProps {
  userType: UserType;
  onUserTypeChange: (type: UserType) => void;
}

export default function RoleSelector({ userType, onUserTypeChange }: RoleSelectorProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View style={[styles.roleSelector, { backgroundColor: theme === 'dark' ? colors.card : '#f2f2f2' }]}>
      <TouchableOpacity
        style={[
          styles.roleButton,
          userType === "borrower" && [styles.activeRoleButton, { backgroundColor: colors.primary }],
        ]}
        onPress={() => onUserTypeChange("borrower")}
      >
        <Text
          style={[
            styles.roleButtonText,
            { color: theme === 'dark' ? colors.textSecondary : '#666' },
            userType === "borrower" && styles.activeRoleButtonText,
          ]}
        >
          Emprunter
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.roleButton,
          userType === "lender" && [styles.activeRoleButton, { backgroundColor: colors.primary }],
        ]}
        onPress={() => onUserTypeChange("lender")}
      >
        <Text
          style={[
            styles.roleButtonText,
            { color: theme === 'dark' ? colors.textSecondary : '#666' },
            userType === "lender" && styles.activeRoleButtonText,
          ]}
        >
          Prêter
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  roleSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 2,
    marginTop: 16,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  activeRoleButton: {
    borderRadius: 10,
  },
  roleButtonText: {
    fontWeight: '500',
  },
  activeRoleButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
