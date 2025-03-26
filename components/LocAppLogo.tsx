import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LocAppLogoProps {
  width?: number;
  height?: number;
  color?: string;
}

const LocAppLogo: React.FC<LocAppLogoProps> = ({ 
  width = 250, 
  height = 100, 
  color = '#FFFFFF' 
}) => {
  return (
    <View style={[styles.container, { width, height }]}>
      <Text style={[styles.text, { color }]}>LocApp</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 42,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  }
});

export default LocAppLogo;
