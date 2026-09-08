import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppContext, Theme } from '../context/AppContext';
import DashboardScreen from './DashboardScreen';
import ExpensesScreen from './ExpensesScreen';
import AnalyticsScreen from './AnalyticsScreen';
import ProfileScreen from './ProfileScreen';
import SpinWheelScreen from './SpinWheelScreen';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', hi: 'डैशबोर्ड', icon: 'view-grid-outline', iconActive: 'view-grid' },
  { id: 'expenses', label: 'Expenses', hi: 'खर्च', icon: 'wallet-outline', iconActive: 'wallet' },
  { id: 'analytics', label: 'Analytics', hi: 'विश्लेषण', icon: 'chart-line', iconActive: 'chart-line' },
  { id: 'profile', label: 'Profile', hi: 'प्रोफ़ाइल', icon: 'account-outline', iconActive: 'account' },
];

export default function AppShell() {
  const context = useContext(AppContext);
  if (!context) return null;

  const { C, isDarkMode, t } = context;
  const [tab, setTab] = useState('dashboard');

  const renderScreen = () => {
    switch (tab) {
      case 'dashboard': return <DashboardScreen setActiveTab={setTab} />;
      case 'expenses': return <ExpensesScreen />;
      case 'analytics': return <AnalyticsScreen />;
      case 'profile': return <ProfileScreen />;
      case 'spin': return <SpinWheelScreen onBack={() => setTab('dashboard')} />;
      default: return <DashboardScreen setActiveTab={setTab} />;
    }
  };

  const s = getStyles(C);

  return (
    <SafeAreaView style={s.root}>
      {/* Screen */}
      <View style={s.screen}>{renderScreen()}</View>

      {/* FAB (dashboard only) */}
      {tab === 'dashboard' && (
        <TouchableOpacity style={s.fab} onPress={() => setTab('expenses')} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={28} color={isDarkMode ? '#000' : '#fff'} />
          <View style={s.fabRing} />
        </TouchableOpacity>
      )}

      {/* Bottom Nav */}
      <View style={s.nav}>
        {TABS.map(tItem => {
          const active = tab === tItem.id;
          return (
            <TouchableOpacity
              key={tItem.id}
              style={[s.navItem, active ? s.navItemActive : null]}
              onPress={() => setTab(tItem.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={(active ? tItem.iconActive : tItem.icon) as any}
                size={22}
                color={active ? C.onSecondaryContainer : C.outline}
              />
              <Text style={[s.navLabel, active ? s.navLabelActive : null]}>
                {t(tItem.id)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (C: Theme) => {
  const isDark = C.surface !== '#fbf9fa';
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.surface },
    screen: {
      flex: 1,
      paddingBottom: Platform.select({ web: 64, ios: 60, android: 58, default: 64 }),
    },
    nav: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: C.cardBg,
      borderTopWidth: 1,
      borderTopColor: C.borderColor,
      paddingVertical: 8,
      paddingBottom: Platform.OS === 'ios' ? 24 : 8,
      ...Platform.select({
        web: { boxShadow: `0 -4px 24px ${C.glassShadow}`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' },
        ios: { shadowColor: C.secondary, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 16 },
        android: { elevation: 10 },
      }),
    },
    navItem: {
      flexDirection: 'column',
      alignItems: 'center',
      paddingVertical: 5,
      paddingHorizontal: 14,
      borderRadius: 22,
    },
    navItemActive: {
      backgroundColor: C.secondaryContainer,
    },
    navLabel: {
      fontSize: 9,
      fontWeight: '600',
      color: C.outline,
      marginTop: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    navLabelActive: {
      color: C.onSecondaryContainer,
    },
    fab: {
      position: 'absolute',
      bottom: Platform.select({ web: 80, ios: 88, default: 76 }),
      right: 20,
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: C.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      ...Platform.select({
        web: { boxShadow: isDark ? '0 6px 20px rgba(0,0,0,0.4)' : '0 6px 20px rgba(65,102,86,0.35)' },
        ios: { shadowColor: C.secondary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
        android: { elevation: 6 },
      }),
    },
    fabRing: {
      position: 'absolute',
      top: -4,
      left: -4,
      right: -4,
      bottom: -4,
      borderRadius: 31,
      borderWidth: 2,
      borderColor: C.secondary,
      opacity: 0.2,
    },
  });
};
