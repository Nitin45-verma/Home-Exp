import React, { useContext } from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { AppContext } from '../context/AppContext';

interface BilingualTextProps {
  en?: string;
  hi?: string;
  enStyle?: TextStyle;
  hiStyle?: TextStyle;
  containerStyle?: ViewStyle;
}

export default function BilingualText({ en, hi, enStyle, hiStyle, containerStyle }: BilingualTextProps) {
  const context = useContext(AppContext);
  const C = context?.C;

  return (
    <View style={[styles.container, containerStyle]}>
      {en ? <Text style={[styles.en, C && { color: C.primary }, enStyle]}>{en}</Text> : null}
      {hi ? <Text style={[styles.hi, C && { color: C.outline }, hiStyle]}>{hi}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  en: {
    fontSize: 16,
    fontWeight: '600',
  },
  hi: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
    marginTop: 2,
  },
});
