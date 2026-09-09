import React, { useState, useRef, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Modal, Easing, Platform, Dimensions, ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppContext, Theme } from '../context/AppContext';
import GlassCard from '../components/GlassCard';

interface SpinWheelScreenProps {
  onBack?: () => void;
  navigation?: any;
}

const { width } = Dimensions.get('window');

export default function SpinWheelScreen({ onBack, navigation }: SpinWheelScreenProps) {
  const context = useContext(AppContext);
  if (!context) return null;

  const { spinWheel, user, t, C } = context;
  const isDark = C.surface !== '#fbf9fa';
  const rewardPoints = user?.rewardPoints || 0;

  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPoints, setWonPoints] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const spinAnimation = useRef(new Animated.Value(0)).current;

  const handleSpin = async () => {
    if (isSpinning) return;
    setErrorMsg(null);
    setIsSpinning(true);

    try {
      // 1. Hit the backend endpoint to get spin results
      const res = await spinWheel();
      const pointsWon = res.wonPoints;

      // 2. Compute rotation degree based on won score or generate a high rotation
      // Let's do 4 full rotations (1440 deg) plus a random offset so it stops on a random angle
      const randomOffset = Math.floor(Math.random() * 360);
      const targetValue = 1440 + randomOffset;

      // Reset animation value
      spinAnimation.setValue(0);

      // 3. Trigger rotation animation
      Animated.timing(spinAnimation, {
        toValue: targetValue,
        duration: 3500, // 3.5 seconds premium feel spin
        easing: Easing.out(Easing.quad), // Slow down gradually
        useNativeDriver: true,
      }).start(() => {
        setIsSpinning(false);
        setWonPoints(pointsWon);
        setShowModal(true);
      });

    } catch (err: any) {
      setIsSpinning(false);
      const errMsg = err.response?.data?.message || err.message || 'Error occurred';
      setErrorMsg(errMsg);
    }
  };

  // Interpolate animation value to string degrees
  const rotateInterpolate = spinAnimation.interpolate({
    inputRange: [0, 3600],
    outputRange: ['0deg', '3600deg']
  });

  const s = getStyles(C);

  // Wheel sectors presets
  const sectors = [
    { label: '10', color: C.secondary, rotate: '0deg' },
    { label: '50', color: C.tertiary, rotate: '60deg' },
    { label: '20', color: C.error, rotate: '120deg' },
    { label: '40', color: C.primary, rotate: '180deg' },
    { label: '15', color: '#3b82f6', rotate: '240deg' },
    { label: '30', color: '#ec4899', rotate: '300deg' },
  ];

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Glow ambient backgrounds */}
      <View style={s.glow1} pointerEvents="none" />
      <View style={s.glow2} pointerEvents="none" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation ? navigation.goBack() : onBack?.()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('spin_wheel_title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Content */}
      <View style={s.content}>
        
        {/* Points Display */}
        <GlassCard style={s.pointsCard}>
          <MaterialCommunityIcons name="star-circle" size={32} color={C.secondary} />
          <View style={{ flex: 1 }}>
            <Text style={s.pointsLabel}>{t('reward_stars_title')}</Text>
            <Text style={s.pointsCount}>
              {t('reward_stars_desc', { points: rewardPoints })}
            </Text>
          </View>
        </GlassCard>

        <Text style={s.gameSub}>{t('spin_wheel_desc')}</Text>

        {/* Spin Game Area */}
        <View style={s.wheelContainer}>
          {/* Wheel Pointer Arrow */}
          <View style={s.pointerContainer}>
            <MaterialCommunityIcons name="menu-down" size={54} color={C.secondary} style={s.pointerIcon} />
          </View>

          {/* Animated Wheel */}
          <Animated.View style={[s.wheel, { transform: [{ rotate: rotateInterpolate }] }]}>
            {sectors.map((sec, idx) => (
              <View 
                key={idx} 
                style={[
                  s.sector, 
                  { 
                    transform: [{ rotate: sec.rotate }],
                    borderRightColor: 'transparent',
                    borderLeftColor: 'transparent',
                  }
                ]}
              >
                <View style={s.sectorInner}>
                  <Text style={[s.sectorText, { color: isDark ? '#fff' : '#1e293b' }]}>
                    {sec.label}
                  </Text>
                  <View style={[s.sectorDot, { backgroundColor: sec.color }]} />
                </View>
              </View>
            ))}
            {/* Center Cap */}
            <View style={s.centerCap}>
              <View style={s.centerCapInner} />
            </View>
          </Animated.View>
        </View>

        {/* Error Alert */}
        {!!errorMsg && (
          <View style={s.errorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={C.error} />
            <Text style={s.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity 
          style={[s.spinBtn, isSpinning && s.spinBtnDisabled]} 
          onPress={handleSpin}
          disabled={isSpinning}
          activeOpacity={0.85}
        >
          <Text style={s.spinBtnText}>
            {isSpinning ? 'SPINNING...' : t('btn_tap_spin').toUpperCase()}
          </Text>
          <Text style={s.spinBtnSub}>
            {isSpinning ? 'Good Luck! 🍀' : 'Daily Free Spin'}
          </Text>
        </TouchableOpacity>

      </View>

      {/* Success Win Modal */}
      <Modal animationType="slide" transparent={true} visible={showModal} onRequestClose={() => setShowModal(false)}>
        <View style={s.modalOverlay}>
          <GlassCard style={s.modalContent}>
            <MaterialCommunityIcons name="trophy" size={64} color={C.secondary} style={{ marginBottom: 12 }} />
            <Text style={s.modalTitle}>{t('spin_success_title')}</Text>
            <Text style={s.modalSubtitle}>
              {t('spin_success_desc', { points: wonPoints || 0 })}
            </Text>

            <TouchableOpacity 
              style={s.collectBtn} 
              onPress={() => {
                setShowModal(false);
                if (navigation) navigation.goBack();
                else onBack?.();
              }}
              activeOpacity={0.8}
            >
              <Text style={s.collectBtnText}>{t('btn_collect')}</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>

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
    scroll: { flexGrow: 1, paddingBottom: 24 },
    glow1: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(130,179,158,0.18)', zIndex: 0 },
    glow2: { position: 'absolute', bottom: -100, left: -100, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(237,227,184,0.18)', zIndex: 0 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderColor: C.borderColor, zIndex: 1 },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: C.surfaceContainer },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.primary },
    content: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'space-around', zIndex: 1 },
    pointsCard: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', padding: 16, borderRadius: 18, borderLeftWidth: 4, borderLeftColor: C.secondary, ...glass },
    pointsLabel: { fontSize: 12, fontWeight: '600', color: C.outline },
    pointsCount: { fontSize: 15, fontWeight: '700', color: C.primary, marginTop: 2 },
    gameSub: { fontSize: 13, color: C.outline, textAlign: 'center', paddingHorizontal: 20 },
    wheelContainer: { position: 'relative', width: 280, height: 280, alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
    pointerContainer: { position: 'absolute', top: -30, zIndex: 5, alignItems: 'center' },
    pointerIcon: { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', elevation: 4 },
    wheel: { width: 260, height: 260, borderRadius: 130, borderWidth: 6, borderColor: C.borderColor, backgroundColor: C.surfaceContainer, overflow: 'hidden', position: 'relative', boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', elevation: 6 },
    sector: { position: 'absolute', width: 260, height: 260, alignItems: 'center', justifyContent: 'flex-start' },
    sectorInner: { alignItems: 'center', paddingTop: 20 },
    sectorText: { fontSize: 16, fontWeight: '800' },
    sectorDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
    centerCap: { position: 'absolute', top: 110, left: 110, width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', elevation: 3 },
    centerCapInner: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.secondary },
    errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: isDark ? 'rgba(248,113,113,0.1)' : 'rgba(186,26,26,0.06)', borderRadius: 12, padding: 12, paddingHorizontal: 16, maxWidth: '90%', marginVertical: 8 },
    errorText: { fontSize: 13, color: C.error, fontWeight: '600', flex: 1, textAlign: 'center' },
    spinBtn: { backgroundColor: C.primary, width: '100%', borderRadius: 16, paddingVertical: 14, alignItems: 'center', boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', elevation: 4 },
    spinBtnDisabled: { opacity: 0.6 },
    spinBtnText: { fontSize: 16, fontWeight: '800', color: isDark ? '#000' : '#fff', letterSpacing: 0.5 },
    spinBtnSub: { fontSize: 10, color: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', marginTop: 2 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    modalContent: { width: '100%', maxWidth: 320, padding: 24, borderRadius: 24, alignItems: 'center', textAlign: 'center', ...glass },
    modalTitle: { fontSize: 20, fontWeight: '800', color: C.primary, marginVertical: 6 },
    modalSubtitle: { fontSize: 14, color: C.outline, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
    collectBtn: { backgroundColor: C.secondary, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32, alignItems: 'center', boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', elevation: 3 },
    collectBtnText: { fontSize: 14, fontWeight: '700', color: C.onSecondaryContainer }
  });
};
