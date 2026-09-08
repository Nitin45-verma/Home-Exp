import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Platform, ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppContext, Theme } from '../context/AppContext';
import GlassCard from './GlassCard';

interface CalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  onAddValue: (value: string) => void;
}

export default function CalculatorModal({ visible, onClose, onAddValue }: CalculatorModalProps) {
  const context = useContext(AppContext);
  if (!context) return null;

  const { C, t } = context;
  const isDark = C.surface !== '#fbf9fa';

  const [formula, setFormula] = useState('');
  const [realtimeResult, setRealtimeResult] = useState('');

  // Update real-time preview result as formula changes
  useEffect(() => {
    if (!formula.trim()) {
      setRealtimeResult('');
      return;
    }

    try {
      const sanitized = formula
        .replace(/×/g, '*')
        .replace(/÷/g, '/');

      // Restrict characters strictly to prevent any remote code execution
      if (!/^[0-9.+\-*/\s]+$/.test(sanitized)) {
        setRealtimeResult('');
        return;
      }

      // Check if expression ends with an operator to avoid eval syntax errors
      if (/[+\-*/]$/.test(sanitized.trim())) {
        return;
      }

      // Safe evaluation of simple math
      const evalResult = new Function(`return (${sanitized})`)();
      if (evalResult !== undefined && !isNaN(evalResult) && isFinite(evalResult)) {
        setRealtimeResult(String(Number(evalResult.toFixed(4))));
      } else {
        setRealtimeResult('');
      }
    } catch {
      // Incomplete math expression
    }
  }, [formula]);

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      setFormula('');
      setRealtimeResult('');
    } else if (key === '=') {
      if (realtimeResult) {
        setFormula(realtimeResult);
        setRealtimeResult('');
      }
    } else if (key === '+' || key === '-' || key === '×' || key === '÷') {
      if (formula.length > 0) {
        const lastChar = formula[formula.length - 1];
        if (['+', '-', '×', '÷'].includes(lastChar)) {
          setFormula(prev => prev.slice(0, -1) + key);
          return;
        }
      }
      if (formula.length === 0 && key !== '-') {
        return;
      }
      setFormula(prev => prev + key);
    } else if (key === '.') {
      const segments = formula.split(/[+\-×÷]/);
      const activeSegment = segments[segments.length - 1];
      if (activeSegment.includes('.')) return;
      
      setFormula(prev => prev + (prev === '' ? '0.' : '.'));
    } else {
      // Numbers (0-9)
      setFormula(prev => prev + key);
    }
  };

  const handleBackspace = () => {
    if (formula.length > 0) {
      setFormula(prev => prev.slice(0, -1));
    }
  };

  const handleAddValue = () => {
    const finalVal = realtimeResult || formula || '0';
    const parsed = parseFloat(finalVal);
    if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0) {
      onAddValue(String(parsed));
      onClose();
    }
  };

  const s = getStyles(C);

  // Keypad Grid Rows: standard layout ending with Add to Expense button
  const keypad = [
    ['C', '÷', '×', 'backspace'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '.'],
    ['0', '=', 'add_to_expense']
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        {/* Soft background tap to close */}
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

        <GlassCard style={s.sheet}>
          <ScrollView 
            contentContainerStyle={s.scrollContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Ambient decorative glows */}
            <View style={s.glow1} pointerEvents="none" />
            <View style={s.glow2} pointerEvents="none" />

            {/* Bottom Sheet Drag Indicator */}
            <View style={s.dragBar} />

            {/* Bilingual Header */}
            <View style={s.header}>
              <View style={s.headerTextContainer}>
                <MaterialCommunityIcons name="calculator-variant" size={20} color={C.primary} style={{ marginRight: 8 }} />
                <View>
                  <Text style={s.headerTitle}>Ghar Ka Hisab / Calculator</Text>
                  <Text style={s.headerTitleHi}>घर का हिसाब / कैलकुलेटर</Text>
                </View>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={18} color={C.primary} />
              </TouchableOpacity>
            </View>

            {/* Stacked Readout Display Screen */}
            <View style={s.displayContainer}>
              {/* Top Line: Live Formula */}
              <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.formulaScroll}
                ref={ref => ref?.scrollToEnd({ animated: true })}
              >
                <Text style={s.formulaText}>
                  {formula || '0'}
                </Text>
              </ScrollView>
              
              {/* Bottom Line: Stacked Prominent Result */}
              <View style={s.resultContainer}>
                <Text style={s.resultText} numberOfLines={1}>
                  {realtimeResult || formula || '0'}
                </Text>
              </View>
            </View>

            {/* Keypad Grid (Strict 4x5 layout of equal-height square buttons) */}
            <View style={s.keypadGrid}>
              {keypad.map((row, rIdx) => (
                <View key={rIdx} style={s.row}>
                  {row.map((btn, bIdx) => {
                    const isOperator = ['+', '-', '×', '÷', 'C'].includes(btn);
                    const isBack = btn === 'backspace';
                    const isEquals = btn === '=';
                    const isAdd = btn === 'add_to_expense';

                    // Apply strict styles
                    const customBtnStyles = [
                      isAdd ? s.btnDouble : s.btn,
                      isOperator && s.btnOperator,
                      isBack && s.btnOperator,
                      isEquals && s.btnEquals,
                      isAdd && s.btnCTA,
                    ] as any;

                    const customTxtStyles = [
                      s.btnText,
                      isOperator && s.btnTextOperator,
                      isEquals && s.btnTextEquals,
                    ] as any;

                    if (isAdd) {
                      return (
                        <TouchableOpacity
                          key={bIdx}
                          style={customBtnStyles}
                          onPress={handleAddValue}
                          activeOpacity={0.8}
                        >
                          <Text style={s.addBtnText}>Add to Expense</Text>
                          <Text style={s.addBtnTextHi}>खर्चे में जोड़ें</Text>
                        </TouchableOpacity>
                      );
                    }

                    return (
                      <TouchableOpacity
                        key={bIdx}
                        style={customBtnStyles}
                        onPress={() => isBack ? handleBackspace() : handleKeyPress(btn)}
                        activeOpacity={0.7}
                      >
                        {isBack ? (
                          <MaterialCommunityIcons name="backspace-outline" size={24} color={C.primary} />
                        ) : (
                          <Text style={customTxtStyles}>{btn}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

          </ScrollView>
        </GlassCard>
      </View>
    </Modal>
  );
}

const getStyles = (C: Theme) => {
  const isDark = C.surface !== '#fbf9fa';
  
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end'
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    },
    sheet: {
      width: '100%',
      maxWidth: 430, // Constraint for desktop / web browser views
      alignSelf: 'center',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderWidth: 1,
      borderColor: C.borderColor,
      backgroundColor: C.cardBg,
      overflow: 'hidden',
      position: 'relative',
      maxHeight: '90%'
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 16,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 36 : 22
    },
    glow1: {
      position: 'absolute',
      top: -60,
      right: -60,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(130,179,158,0.15)',
      zIndex: 0
    },
    glow2: {
      position: 'absolute',
      bottom: -60,
      left: -60,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(237,227,184,0.12)',
      zIndex: 0
    },
    dragBar: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: C.outlineVariant + '44',
      alignSelf: 'center',
      marginBottom: 10
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
      position: 'relative',
      zIndex: 1
    },
    headerTextContainer: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: C.primary
    },
    headerTitleHi: {
      fontSize: 10,
      fontWeight: '600',
      color: C.outline,
      marginTop: 1
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: C.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.borderColor
    },
    displayContainer: {
      backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.45)',
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: C.borderColor,
      padding: 16,
      marginBottom: 16,
      alignItems: 'flex-end',
      justifyContent: 'center',
      zIndex: 1
    },
    formulaScroll: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'flex-end'
    },
    formulaText: {
      fontSize: 16,
      fontWeight: '500',
      color: C.outline,
      textAlign: 'right'
    },
    resultContainer: {
      height: 48,
      marginTop: 4,
      justifyContent: 'center'
    },
    resultText: {
      fontSize: 38,
      fontWeight: '800',
      color: C.primary,
      textAlign: 'right'
    },
    keypadGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 0, // Gaps managed by margin
      zIndex: 1
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 2
    },
    btn: {
      width: '22%', // Strict 4-column layout spacing within bounds
      aspectRatio: 1, // Keep standard keypad keys square
      borderRadius: 16,
      margin: '1.5%',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#eceff1',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.borderColor
    },
    btnDouble: {
      width: '47%', // Span 2 columns beautifully
      aspectRatio: 2.13, // Perfectly matches button row height
      borderRadius: 16,
      margin: '1.5%',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#eceff1',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.borderColor
    },
    btnOperator: {
      backgroundColor: isDark ? 'rgba(237,227,184,0.18)' : '#f5ebd0',
      borderColor: isDark ? 'rgba(237,227,184,0.3)' : '#e2d5b6'
    },
    btnEquals: {
      backgroundColor: C.primary,
      borderColor: C.primary
    },
    btnCTA: {
      backgroundColor: '#2e7d32', // Forest green
      borderColor: '#1b5e20'
    },
    btnText: {
      fontSize: 20,
      fontWeight: '600',
      color: C.onSurface
    },
    btnTextOperator: {
      color: C.tertiary,
      fontWeight: '700'
    },
    btnTextEquals: {
      color: isDark ? '#000' : '#fff',
      fontWeight: '800'
    },
    addBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
      textAlign: 'center'
    },
    addBtnTextHi: {
      fontSize: 11,
      fontWeight: '700',
      color: '#ffffff',
      opacity: 0.85,
      marginTop: 1,
      textAlign: 'center'
    }
  });
};
