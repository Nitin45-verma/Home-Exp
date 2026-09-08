import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { AppContext, Theme } from '../context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LoginScreenProps {
  setAuthScreen?: (screen: 'login' | 'signup') => void;
  navigation?: any;
}

export default function LoginScreen({ setAuthScreen, navigation }: LoginScreenProps) {
  const context = useContext(AppContext);
  if (!context) return null;

  const { login, sendEmailOtp, verifyEmailOtp, t, C } = context;
  const isDark = C.surface !== '#fbf9fa';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useOtpLogin, setUseOtpLogin] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string | null; password?: string | null; otp?: string | null }>({});

  // OTP Verification States
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpMsg, setOtpMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [timer, setTimer] = useState(0);

  const isEmail = phone.includes('@');

  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const validate = () => {
    const e: typeof errors = {};
    const cleanPhone = phone.trim();
    
    if (isEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanPhone)) {
        e.phone = t('invalid_email');
      }
    } else {
      if (!cleanPhone || cleanPhone.length !== 10 || !/^\d{10}$/.test(cleanPhone)) {
        e.phone = t('phone_req');
      }
    }

    if (!useOtpLogin && !password) {
      e.password = t('pass_required');
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleLogin = async () => {
    if (validate()) {
      setIsLoading(true);
      await login(phone.trim(), password);
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const cleanEmail = phone.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrors(prev => ({ ...prev, phone: t('invalid_email') }));
      return;
    }

    setIsSendingOtp(true);
    setOtpMsg(null);
    const res = await sendEmailOtp(cleanEmail);
    setIsSendingOtp(false);

    if (res.success) {
      setOtpSent(true);
      setTimer(60);
      setOtpMsg({ text: res.message, isError: false });
    } else {
      setOtpMsg({ text: res.message, isError: true });
    }
  };

  const handleVerifyOtpLogin = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrors(prev => ({ ...prev, otp: t('otp_req') }));
      return;
    }

    setIsVerifyingOtp(true);
    setOtpMsg(null);
    const res = await verifyEmailOtp(phone.trim(), otp.trim());
    setIsVerifyingOtp(false);

    if (!res.success) {
      setOtpMsg({ text: res.message, isError: true });
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    await login('9876543210', 'password');
    setIsLoading(false);
  };

  const s = getStyles(C);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Ambient glows */}
        <View style={s.glow1} pointerEvents="none" />
        <View style={s.glow2} pointerEvents="none" />

        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoBox}>
            <MaterialCommunityIcons name="wallet" size={28} color="#fff" />
          </View>
          <Text style={s.logoText}>HomeBudget</Text>
          <Text style={s.logoSub}>{t('logo_sub')}</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{t('login_welcome')}</Text>
          <Text style={s.cardSub}>{t('login_welcome_sub')}</Text>

          {/* Email/Phone */}
          <View style={s.field}>
            <Text style={s.label}>{t('phone_label')}</Text>
            <View style={[s.inputRow, errors.phone ? s.inputError : null]}>
              {(!phone.includes('@') && /^\d*$/.test(phone)) ? <Text style={s.prefix}>+91</Text> : null}
              <TextInput
                style={s.input}
                placeholder={t('phone_placeholder')}
                placeholderTextColor={C.outline + '99'}
                keyboardType="email-address"
                autoCapitalize="none"
                value={phone}
                onChangeText={tVal => { setPhone(tVal); setErrors(e => ({ ...e, phone: null })); }}
              />
              {isEmail && (
                <TouchableOpacity
                  style={[s.sendOtpInlineBtn, isSendingOtp ? { opacity: 0.6 } : null]}
                  onPress={() => {
                    setUseOtpLogin(true);
                    handleSendOtp();
                  }}
                  disabled={isSendingOtp}>
                  {isSendingOtp ? (
                    <ActivityIndicator size="small" color={C.primary} />
                  ) : (
                    <Text style={s.sendOtpInlineText}>
                      {otpSent ? (timer > 0 ? `${timer}s` : t('resend_otp')) : t('send_otp')}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
            {errors.phone ? <Text style={s.err}>{errors.phone}</Text> : null}
          </View>

          {/* OTP Input Section if useOtpLogin is enabled */}
          {useOtpLogin && otpSent ? (
            <View style={s.otpCardBox}>
              <Text style={s.label}>{t('otp_label')}</Text>
              <View style={[s.inputRow, errors.otp ? s.inputError : null, { marginTop: 4 }]}>
                <MaterialCommunityIcons name="shield-key-outline" size={20} color={C.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[s.input, { letterSpacing: 6, fontWeight: '700' }]}
                  placeholder="123456"
                  placeholderTextColor={C.outline + '88'}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={val => {
                    setOtp(val);
                    setErrors(e => ({ ...e, otp: null }));
                  }}
                />
                <TouchableOpacity
                  style={s.verifyOtpBtn}
                  onPress={handleVerifyOtpLogin}
                  disabled={isVerifyingOtp}>
                  {isVerifyingOtp ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={s.verifyOtpBtnText}>{t('verify_otp_btn')}</Text>
                  )}
                </TouchableOpacity>
              </View>
              {errors.otp ? <Text style={s.err}>{errors.otp}</Text> : null}
            </View>
          ) : (
            /* Password Field */
            <View style={s.field}>
              <View style={s.labelRow}>
                <Text style={s.label}>{t('pin_label')}</Text>
                <TouchableOpacity><Text style={s.forgot}>{t('pin_forgot')}</Text></TouchableOpacity>
              </View>
              <View style={[s.inputRow, errors.password ? s.inputError : null]}>
                <TextInput
                  style={[s.input, { flex: 1, letterSpacing: showPassword ? 2 : 6 }]}
                  placeholder="• • • • • •"
                  placeholderTextColor={C.outline + '99'}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={tVal => { setPassword(tVal); setErrors(e => ({ ...e, password: null })); }}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={s.eyeBtn}>
                  <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.outline} />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={s.err}>{errors.password}</Text> : null}
            </View>
          )}

          {/* Status message */}
          {otpMsg && (
            <View style={[s.msgBanner, otpMsg.isError ? s.msgBannerErr : s.msgBannerSuccess]}>
              <MaterialCommunityIcons
                name={otpMsg.isError ? "alert-circle-outline" : "check-circle-outline"}
                size={16}
                color={otpMsg.isError ? C.error : "#16a34a"}
              />
              <Text style={[s.msgText, { color: otpMsg.isError ? C.error : "#16a34a" }]}>
                {otpMsg.text}
              </Text>
            </View>
          )}

          {/* Login Button */}
          {!useOtpLogin && (
            <TouchableOpacity style={s.primaryBtn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
              {isLoading
                ? <ActivityIndicator color={isDark ? '#000' : '#fff'} />
                : <><Text style={s.primaryBtnText}>{t('login_btn')}</Text><Text style={s.primaryBtnSub}>{t('login_btn_sub')}</Text></>}
            </TouchableOpacity>
          )}
        </View>

        {/* Divider */}
        <View style={s.divider}>
          <View style={s.divLine} />
          <Text style={s.divText}>{t('or_divider')}</Text>
          <View style={s.divLine} />
        </View>

        {/* Quick Login */}
        <View style={s.socialRow}>
          <TouchableOpacity style={s.socialBtn} onPress={handleGoogle} disabled={isLoading}>
            <MaterialCommunityIcons name="google" size={22} color={C.primary} />
            <Text style={s.socialText}>{t('continue_google')}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Link to Switch to Sign Up */}
        <View style={s.footer}>
          <TouchableOpacity onPress={() => navigation ? navigation.navigate('SignUp') : setAuthScreen?.('signup')}>
            <Text style={s.footerText}>
              {t('new_to_app')}{' '}
              <Text style={s.footerLink}>{t('create_account')}</Text>
            </Text>
          </TouchableOpacity>
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
    glow1: { position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(195,236,215,0.22)', zIndex: 0 },
    glow2: { position: 'absolute', bottom: -80, left: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(237,227,184,0.22)', zIndex: 0 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingBottom: 24, gap: 0 },
    logoWrap: { alignItems: 'center', marginBottom: 28 },
    logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 5 },
    logoText: { fontSize: 26, fontWeight: '700', color: C.primary, letterSpacing: -0.5 },
    logoSub: { fontSize: 12, color: C.outline, marginTop: 3 },
    card: { backgroundColor: C.cardBg, borderRadius: 24, borderWidth: 1, borderColor: C.borderColor, padding: 20, gap: 0, ...glass },
    cardTitle: { fontSize: 22, fontWeight: '700', color: C.primary, marginBottom: 2 },
    cardSub: { fontSize: 12, color: C.outline, marginBottom: 20 },
    field: { marginBottom: 16 },
    label: { fontSize: 10, fontWeight: '700', color: C.onSurfaceVariant, letterSpacing: 0.6, marginBottom: 7, textTransform: 'uppercase' },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceContainer, borderRadius: 14, borderWidth: 1, borderColor: C.outlineVariant + '55', paddingHorizontal: 14, minHeight: 50 },
    inputError: { borderColor: C.error },
    prefix: { fontSize: 15, fontWeight: '700', color: C.primary, marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: C.primary, paddingVertical: 12 },
    sendOtpInlineBtn: { backgroundColor: C.secondaryContainer, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
    sendOtpInlineText: { fontSize: 12, fontWeight: '700', color: C.onSecondaryContainer },
    otpCardBox: { backgroundColor: C.surfaceContainerLow, borderRadius: 16, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: C.outlineVariant + '44' },
    verifyOtpBtn: { backgroundColor: C.secondary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
    verifyOtpBtnText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
    msgBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 12, marginBottom: 14 },
    msgBannerSuccess: { backgroundColor: 'rgba(22, 163, 74, 0.1)' },
    msgBannerErr: { backgroundColor: 'rgba(220, 38, 38, 0.1)' },
    msgText: { fontSize: 12, fontWeight: '600', flex: 1 },
    eyeBtn: { padding: 6 },
    err: { fontSize: 11, color: C.error, marginTop: 5, marginLeft: 2 },
    forgot: { fontSize: 11, fontWeight: '600', color: C.secondary },
    primaryBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 6, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 },
    primaryBtnText: { fontSize: 15, fontWeight: '700', color: isDark ? '#000' : '#fff' },
    primaryBtnSub: { fontSize: 10, color: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', marginTop: 2 },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
    divLine: { flex: 1, height: 1, backgroundColor: C.outlineVariant + '44' },
    divText: { fontSize: 10, fontWeight: '600', color: C.outline + '99', letterSpacing: 1 },
    socialRow: { alignItems: 'center', gap: 10 },
    socialBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 22, borderRadius: 14, borderWidth: 1, borderColor: C.outlineVariant + '88', backgroundColor: 'rgba(255,255,255,0.85)', width: '100%', justifyContent: 'center', ...Platform.select({ web: { boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(10,20,34,0.05)' } }) },
    socialText: { fontSize: 14, fontWeight: '600', color: C.primary },
    footer: { alignItems: 'center', marginTop: 24, paddingBottom: 8 },
    footerText: { fontSize: 13, color: C.onSurfaceVariant },
    footerLink: { fontWeight: '700', color: C.primary },
  });
};
