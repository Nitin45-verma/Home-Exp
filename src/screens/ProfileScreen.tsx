import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { AppContext, Theme } from '../context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const context = useContext(AppContext);
  if (!context) return null;

  const { user, updateProfile, logout, t, isDarkMode, toggleTheme, C } = context;
  const lang = user?.preferredLanguage || 'en';

  const [name, setName] = useState(user?.name || '');
  const [budget, setBudget] = useState(String(user?.monthlyBudget || ''));
  const [language, setLanguage] = useState(user?.preferredLanguage || 'en');
  const [savingsName, setSavingsName] = useState(user?.savingsName || '');
  const [savingsTarget, setSavingsTarget] = useState(String(user?.savingsTarget || ''));
  const [savingsAchieved, setSavingsAchieved] = useState(String(user?.savingsAchieved || ''));

  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ name?: string | null; budget?: string | null }>({});

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBudget(String(user.monthlyBudget));
      setLanguage(user.preferredLanguage);
      setSavingsName(user.savingsName || '');
      setSavingsTarget(String(user.savingsTarget || ''));
      setSavingsAchieved(String(user.savingsAchieved || ''));
    }
  }, [user]);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = t('name_required');
    const n = parseInt(budget, 10);
    if (!budget || isNaN(n) || n < 0) e.budget = t('budget_required');
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (validate()) {
      await updateProfile({
        name: name.trim(),
        budgetLimit: budget,
        language,
        savingsName: savingsName.trim() || undefined,
        savingsTarget: savingsTarget || undefined,
        savingsAchieved: savingsAchieved || undefined
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const s = getStyles(C);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>{t('profile_title')}</Text>
          <Text style={s.pageSub}>{t('profile_subtitle')}</Text>
        </View>

        {success && (
          <View style={s.successBox}>
            <MaterialCommunityIcons name="check-circle-outline" size={18} color="#002115" />
            <Text style={s.successText}>{t('pref_saved')}</Text>
          </View>
        )}

        {/* --- Theme Switcher Option (Dark/Light Mode) --- */}
        <View style={[s.card, { marginBottom: 14 }]}>
          <View style={s.switchRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={s.switchTitle}>{t('theme_label')}</Text>
              <Text style={s.switchSub}>{t('theme_sub')}</Text>
            </View>
            <TouchableOpacity 
              style={[s.switchTrack, isDarkMode && s.switchTrackActive]} 
              onPress={toggleTheme}
              activeOpacity={0.8}
            >
              <View style={[s.switchThumb, isDarkMode && s.switchThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.card}>
          {/* Name */}
          <View style={s.field}>
            <Text style={s.label}>{t('name_label')}</Text>
            <View style={[s.inputRow, errors.name && s.inputErr]}>
              <MaterialCommunityIcons name="account-outline" size={18} color={C.outline} style={{ marginRight: 8 }} />
              <TextInput
                style={s.input}
                placeholder={t('name_placeholder')}
                placeholderTextColor={C.outline + '88'}
                value={name}
                onChangeText={tVal => { setName(tVal); setErrors(e => ({ ...e, name: null })); }}
              />
            </View>
            {errors.name && <Text style={s.err}>{errors.name}</Text>}
          </View>

          {/* Budget */}
          <View style={s.field}>
            <Text style={s.label}>{t('budget_label')}</Text>
            <View style={[s.inputRow, errors.budget && s.inputErr]}>
              <Text style={s.rupee}>₹</Text>
              <TextInput
                style={s.input}
                placeholder="0"
                placeholderTextColor={C.outline + '88'}
                keyboardType="numeric"
                value={budget}
                onChangeText={tVal => { setBudget(tVal.replace(/\D/g, '')); setErrors(e => ({ ...e, budget: null })); }}
              />
            </View>
          </View>

          {/* Language Toggle */}
          <View style={s.field}>
            <Text style={s.label}>{t('lang_label')}</Text>
            <View style={s.langRow}>
              {[
                { id: 'en', label: 'English (अंग्रेज़ी)' },
                { id: 'hi', label: 'हिंदी (Hindi)' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  style={[s.langBtn, language === opt.id && s.langBtnActive]}
                  onPress={() => setLanguage(opt.id)}
                >
                  <Text style={[s.langBtnText, language === opt.id && s.langBtnTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Savings Goal Card */}
        <View style={[s.card, { marginTop: 14 }]}>
          <Text style={s.sectionHeader}>🎯 {t('savings_goal')}</Text>

          {/* Savings Target Name */}
          <View style={s.field}>
            <Text style={s.label}>{t('savings_name_label')}</Text>
            <View style={s.inputRow}>
              <MaterialCommunityIcons name="target" size={18} color={C.outline} style={{ marginRight: 8 }} />
              <TextInput
                style={s.input}
                placeholder={t('savings_name_placeholder')}
                placeholderTextColor={C.outline + '88'}
                value={savingsName}
                onChangeText={setSavingsName}
              />
            </View>
          </View>

          <View style={s.rowFields}>
            {/* Target Amount */}
            <View style={[s.field, { flex: 1 }]}>
              <Text style={s.label}>{t('savings_target_label')}</Text>
              <View style={s.inputRow}>
                <Text style={s.rupeeSmall}>₹</Text>
                <TextInput
                  style={s.input}
                  placeholder="0"
                  placeholderTextColor={C.outline + '88'}
                  keyboardType="numeric"
                  value={savingsTarget}
                  onChangeText={tVal => setSavingsTarget(tVal.replace(/\D/g, ''))}
                />
              </View>
            </View>

            {/* Achieved Amount */}
            <View style={[s.field, { flex: 1 }]}>
              <Text style={s.label}>{t('savings_achieved_label')}</Text>
              <View style={s.inputRow}>
                <Text style={s.rupeeSmall}>₹</Text>
                <TextInput
                  style={s.input}
                  placeholder="0"
                  placeholderTextColor={C.outline + '88'}
                  keyboardType="numeric"
                  value={savingsAchieved}
                  onChangeText={tVal => setSavingsAchieved(tVal.replace(/\D/g, ''))}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ marginTop: 20, gap: 10 }}>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={s.saveText}>{t('btn_save_pref')}</Text>
            <Text style={s.saveSub}>{t('btn_save_pref_sub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.85}>
            <Text style={s.logoutText}>{t('btn_sign_out')}</Text>
            <Text style={s.logoutSub}>{t('btn_sign_out_sub')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const getStyles = (C: Theme) => {
  const isDark = C.surface !== '#fbf9fa';
  const glass = Platform.select({
    web: { boxShadow: `0 8px 32px ${C.glassShadow}`, backdropFilter: 'blur(20px)' },
    ios: { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', },
    android: { elevation: 2 }
  });

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.surface },
    scroll: { flexGrow: 1, padding: 20, paddingBottom: 24 },
    titleRow: { marginBottom: 18 },
    pageTitle: { fontSize: 22, fontWeight: '700', color: C.primary },
    pageSub: { fontSize: 12, color: C.outline, marginTop: 3 },
    successBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#c3ecd7', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(65,102,86,0.2)', padding: 12, marginBottom: 16 },
    successText: { fontSize: 13, fontWeight: '600', color: '#002115', flex: 1 },
    card: { backgroundColor: C.cardBg, borderRadius: 24, borderWidth: 1, borderColor: C.borderColor, padding: 18, ...glass },
    sectionHeader: { fontSize: 14, fontWeight: '700', color: C.primary, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
    field: { marginBottom: 16 },
    label: { fontSize: 10, fontWeight: '700', color: C.onSurfaceVariant, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceContainer, borderRadius: 14, borderWidth: 1, borderColor: C.outlineVariant + '55', paddingHorizontal: 14, minHeight: 50 },
    inputErr: { borderColor: C.error },
    rupee: { fontSize: 18, fontWeight: '700', color: C.primary, marginRight: 8 },
    rupeeSmall: { fontSize: 15, fontWeight: '700', color: C.primary, marginRight: 6 },
    input: { flex: 1, fontSize: 15, color: C.primary, paddingVertical: 12 },
    err: { fontSize: 11, color: C.error, marginTop: 5, marginLeft: 2 },
    langRow: { flexDirection: 'row', gap: 10 },
    langBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1.5, borderColor: C.outlineVariant + '55', backgroundColor: C.surfaceContainer },
    langBtnActive: { borderColor: C.secondary, backgroundColor: C.secondaryContainer },
    langBtnText: { fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant },
    langBtnTextActive: { color: C.onSecondaryContainer, fontWeight: '700' },
    rowFields: { flexDirection: 'row', gap: 10 },
    saveBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', elevation: 4 },
    saveText: { fontSize: 15, fontWeight: '700', color: isDark ? '#000' : '#fff' },
    saveSub: { fontSize: 10, color: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', marginTop: 2 },
    logoutBtn: { backgroundColor: 'transparent', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.error + '44' },
    logoutText: { fontSize: 15, fontWeight: '700', color: C.error },
    logoutSub: { fontSize: 10, color: C.error, opacity: 0.6, marginTop: 2 },
    
    // Switch styling
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    switchTitle: { fontSize: 14, fontWeight: '700', color: C.primary },
    switchSub: { fontSize: 11, color: C.outline, marginTop: 2 },
    switchTrack: { width: 46, height: 26, borderRadius: 13, backgroundColor: C.outlineVariant + '77', padding: 2, justifyContent: 'center' },
    switchTrackActive: { backgroundColor: C.secondary },
    switchThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', elevation: 2, transform: [{ translateX: 0 }] },
    switchThumbActive: { transform: [{ translateX: 20 }] },
  });
};
