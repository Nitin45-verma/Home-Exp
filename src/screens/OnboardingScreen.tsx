import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { AppContext, Theme } from '../context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const STEPS = [
  { id: 'name', step: 1 },
  { id: 'budget', step: 2 },
  { id: 'language', step: 3 },
];

export default function OnboardingScreen() {
  const context = useContext(AppContext);
  if (!context) return null;

  const { completeOnboarding, t, C } = context;
  const isDark = C.surface !== '#fbf9fa';
  
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState('');

  const validateStep = () => {
    if (step === 0) {
      if (!name.trim()) {
        setError(t('name_required', undefined, language));
        return false;
      }
    } else if (step === 1) {
      const val = parseInt(budget, 10);
      if (!budget || isNaN(val) || val <= 0) {
        setError(t('budget_required', undefined, language));
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleNext = async () => {
    if (validateStep()) {
      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else {
        await completeOnboarding({ name, budgetLimit: budget, language });
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setError('');
    }
  };

  const namePresets = language === 'hi'
    ? ["सुनीता शर्मा", "मीरा देवी", "राजेश कुमार"]
    : ["Sunita Sharma", "Meera Devi", "Rajesh Kumar"];

  const budgetPresets = [
    { label: "₹10,000", val: "10000" },
    { label: "₹15,000", val: "15000" },
    { label: "₹25,000", val: "25000" },
    { label: "₹40,000", val: "40000" }
  ];

  const s = getStyles(C);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Ambient glows */}
        <View style={s.glow1} pointerEvents="none" />
        <View style={s.glow2} pointerEvents="none" />

        {/* Header */}
        <View style={s.header}>
          <View style={s.logoBox}>
            <MaterialCommunityIcons name="wallet" size={24} color="#fff" />
          </View>
          <Text style={s.headerTitle}>HomeBudget</Text>
          <Text style={s.headerSub}>{t('onboard_subtitle', undefined, language)}</Text>
        </View>

        {/* Step Indicator */}
        <View style={s.stepRow}>
          {STEPS.map((sItem, idx) => (
            <React.Fragment key={sItem.id}>
              <View style={s.stepItem}>
                <View style={[s.stepDot, step >= idx && s.stepDotActive]}>
                  {step > idx ? (
                    <MaterialCommunityIcons name="check" size={14} color="#fff" />
                  ) : (
                    <Text style={[s.stepNum, step >= idx && s.stepNumActive]}>{sItem.step}</Text>
                  )}
                </View>
              </View>
              {idx < STEPS.length - 1 && (
                <View style={[s.stepLine, step > idx && s.stepLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Content Card */}
        <View style={s.card}>
          {step === 0 && (
            <View>
              <Text style={s.stepTitle}>{t('step_name', undefined, language)}</Text>
              <Text style={s.stepTitleHi}>{t('step_name_sub', undefined, language)}</Text>

              <View style={s.field}>
                <Text style={s.label}>{t('name_label', undefined, language)}</Text>
                <View style={[s.inputRow, !!error && s.inputErr]}>
                  <TextInput
                    style={s.input}
                    placeholder={t('name_placeholder', undefined, language)}
                    placeholderTextColor={C.outline + '88'}
                    value={name}
                    onChangeText={tVal => { setName(tVal); setError(''); }}
                  />
                </View>
              </View>

              {/* Name Presets */}
              <View style={s.presets}>
                {namePresets.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[s.preset, name === p && s.presetActive]}
                    onPress={() => { setName(p); setError(''); }}
                  >
                    <Text style={[s.presetText, name === p && s.presetTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 1 && (
            <View>
              <Text style={s.stepTitle}>{t('step_budget', undefined, language)}</Text>
              <Text style={s.stepTitleHi}>{t('step_budget_sub', undefined, language)}</Text>

              <View style={s.field}>
                <Text style={s.label}>{t('budget_label', undefined, language)}</Text>
                <View style={[s.inputRow, !!error && s.inputErr]}>
                  <Text style={s.rupee}>₹</Text>
                  <TextInput
                    style={s.input}
                    placeholder="15,000"
                    placeholderTextColor={C.outline + '88'}
                    keyboardType="numeric"
                    value={budget}
                    onChangeText={tVal => { setBudget(tVal.replace(/\D/g, '')); setError(''); }}
                  />
                </View>
              </View>

              {/* Budget Presets */}
              <View style={s.presets}>
                {budgetPresets.map(p => (
                  <TouchableOpacity
                    key={p.val}
                    style={[s.preset, budget === p.val && s.presetActive]}
                    onPress={() => { setBudget(p.val); setError(''); }}
                  >
                    <Text style={[s.presetText, budget === p.val && s.presetTextActive]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={s.stepTitle}>{t('step_language', undefined, language)}</Text>
              <Text style={s.stepTitleHi}>{t('step_language_sub', undefined, language)}</Text>

              <View style={s.langRow}>
                {[
                  { id: 'en', flag: '🇬🇧', label: 'English', desc: 'Default layout' },
                  { id: 'hi', flag: '🇮🇳', label: 'हिंदी (Hindi)', desc: 'लोकल लेआउट' }
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[s.langCard, language === opt.id && s.langCardActive]}
                    onPress={() => setLanguage(opt.id)}
                  >
                    <Text style={s.langFlag}>{opt.flag}</Text>
                    <Text style={[s.langLabel, language === opt.id && s.langLabelActive]}>{opt.label}</Text>
                    <Text style={s.langSub}>{opt.desc}</Text>
                    {language === opt.id && (
                      <MaterialCommunityIcons name="check-circle" size={16} color={C.secondary} style={s.langCheck} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Currency Note */}
              <View style={s.currencyBox}>
                <MaterialCommunityIcons name="information" size={18} color={C.secondary} />
                <View>
                  <Text style={s.currencyLabel}>{t('currency_label', undefined, language)}</Text>
                  <Text style={s.currencyValue}>{t('currency_value', undefined, language)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Step Error */}
          {!!error && <Text style={s.err}>{error}</Text>}

          {/* Action Buttons */}
          <View style={s.btnRow}>
            {step > 0 && (
              <TouchableOpacity style={s.backBtn} onPress={handleBack} activeOpacity={0.7}>
                <MaterialCommunityIcons name="arrow-left" size={16} color={C.onSurfaceVariant} />
                <Text style={s.backText}>{t('btn_back', undefined, language)}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={s.nextText}>
                {step === STEPS.length - 1 
                  ? t('btn_save_setup', undefined, language) 
                  : t('btn_continue', undefined, language)}
              </Text>
              <Text style={s.nextSub}>
                {step === STEPS.length - 1 
                  ? t('btn_save_setup_sub', undefined, language) 
                  : t('btn_continue_sub', undefined, language)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const getStyles = (C: Theme) => {
  const glass = Platform.select({
    web: { boxShadow: `0 8px 32px ${C.glassShadow}`, backdropFilter: 'blur(20px)' },
    ios: { shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16 },
    android: { elevation: 3 }
  });
  const isDark = C.surface !== '#fbf9fa';

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.surface },
    glow1: { position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(195,236,215,0.2)', zIndex: 0 },
    glow2: { position: 'absolute', bottom: -80, left: -80, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(237,227,184,0.2)', zIndex: 0 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingBottom: 24 },
    header: { alignItems: 'center', marginBottom: 28 },
    logoBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: C.primary },
    headerSub: { fontSize: 12, color: C.outline, marginTop: 3, textAlign: 'center' },
    stepRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24, gap: 0 },
    stepItem: { flexDirection: 'row', alignItems: 'center' },
    stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: C.outlineVariant, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    stepDotActive: { borderColor: C.secondary, backgroundColor: C.secondary },
    stepNum: { fontSize: 12, fontWeight: '700', color: C.outline },
    stepNumActive: { color: '#fff' },
    stepLine: { width: 40, height: 2, backgroundColor: C.outlineVariant + '55' },
    stepLineActive: { backgroundColor: C.secondary },
    card: { backgroundColor: C.cardBg, borderRadius: 24, borderWidth: 1, borderColor: C.borderColor, padding: 22, ...glass },
    stepTitle: { fontSize: 20, fontWeight: '700', color: C.primary, marginBottom: 3 },
    stepTitleHi: { fontSize: 12, color: C.outline, marginBottom: 20 },
    field: { marginBottom: 8 },
    label: { fontSize: 10, fontWeight: '700', color: C.onSurfaceVariant, letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceContainer, borderRadius: 14, borderWidth: 1, borderColor: C.outlineVariant + '55', paddingHorizontal: 14, minHeight: 50 },
    inputErr: { borderColor: C.error },
    input: { flex: 1, fontSize: 15, color: C.primary, paddingVertical: 12 },
    rupee: { fontSize: 18, fontWeight: '700', color: C.primary, marginRight: 8 },
    err: { fontSize: 11, color: C.error, marginTop: 6, marginLeft: 2, marginBottom: 4 },
    presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    preset: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: C.surfaceContainer, borderWidth: 1, borderColor: C.outlineVariant + '55' },
    presetActive: { backgroundColor: C.secondaryContainer, borderColor: C.secondary },
    presetText: { fontSize: 12, fontWeight: '600', color: C.onSurfaceVariant },
    presetTextActive: { color: C.onSecondaryContainer },
    langRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    langCard: { flex: 1, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '55', backgroundColor: C.surfaceContainer, paddingVertical: 16, position: 'relative' },
    langCardActive: { borderColor: C.secondary, backgroundColor: isDark ? 'rgba(130,179,158,0.15)' : C.secondaryContainer + '55' },
    langFlag: { fontSize: 28, marginBottom: 6 },
    langLabel: { fontSize: 15, fontWeight: '700', color: C.onSurface },
    langLabelActive: { color: C.secondary },
    langSub: { fontSize: 11, color: C.outline, marginTop: 2 },
    langCheck: { position: 'absolute', top: 8, right: 8 },
    currencyBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: isDark ? 'rgba(130,179,158,0.12)' : 'rgba(195,236,215,0.18)', borderRadius: 12, borderWidth: 1, borderColor: C.borderColor, padding: 12 },
    currencyLabel: { fontSize: 11, fontWeight: '600', color: C.secondary },
    currencyValue: { fontSize: 12, color: C.onSurfaceVariant, marginTop: 1 },
    btnRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: C.outlineVariant + '66' },
    backText: { fontSize: 14, fontWeight: '600', color: C.onSurfaceVariant },
    nextBtn: { flex: 2, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 },
    nextText: { fontSize: 14, fontWeight: '700', color: isDark ? '#000' : '#fff' },
    nextSub: { fontSize: 10, color: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', marginTop: 2 },
  });
};
