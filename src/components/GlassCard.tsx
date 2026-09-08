import React, { ReactNode, useContext } from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { AppContext } from '../context/AppContext';

interface GlassCardProps {
  children?: ReactNode;
  style?: ViewStyle;
  [key: string]: any;
}

export default function GlassCard({ children, style, ...props }: GlassCardProps) {
  const context = useContext(AppContext);
  const C = context?.C;

  return (
    <View 
      style={[
        styles.card, 
        C && {
          backgroundColor: C.cardBg,
          borderColor: C.borderColor,
        },
        Platform.select({
          web: C && {
            boxShadow: `0 8px 30px ${C.glassShadow}`,
          },
          ios: C && {
            shadowColor: C.primary,
          }
        }) as any,
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
    }),
  },
});
