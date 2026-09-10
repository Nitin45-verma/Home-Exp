import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppContext, Theme } from '../context/AppContext';
import DashboardScreen from './DashboardScreen';
import ExpensesScreen from './ExpensesScreen';
import AnalyticsScreen from './AnalyticsScreen';
import ProfileScreen from './ProfileScreen';
import SpinWheelScreen from './SpinWheelScreen';

const TABS = [
  { id: 'dashboard', label: 'Home',     icon: 'view-grid-outline',  iconActive: 'view-grid' },
  { id: 'expenses',  label: 'Expenses', icon: 'wallet-outline',      iconActive: 'wallet' },
  { id: 'analytics', label: 'Insights', icon: 'chart-line',          iconActive: 'chart-line' },
  { id: 'profile',   label: 'Profile',  icon: 'account-circle-outline', iconActive: 'account-circle' },
];

// Max content width for web
const MAX_W = 680;

export default function AppShell() {
  const context = useContext(AppContext);
  if (!context) return null;

  const { C, isDarkMode } = context;
  const [tab, setTab] = useState('dashboard');

  const renderScreen = () => {
    switch (tab) {
      case 'dashboard': return <DashboardScreen setActiveTab={setTab} />;
      case 'expenses':  return <ExpensesScreen />;
      case 'analytics': return <AnalyticsScreen />;
      case 'profile':   return <ProfileScreen />;
      case 'spin':      return <SpinWheelScreen onBack={() => setTab('dashboard')} />;
      default:          return <DashboardScreen setActiveTab={setTab} />;
    }
  };

  const s = getStyles(C);

  return (
    <SafeAreaView style={s.root}>
      {/* Responsive centering shell */}
      <View style={s.shell}>
        {/* Screen content */}
        <View style={s.screen}>{renderScreen()}</View>

        {/* FAB — only on dashboard */}
        {tab === 'dashboard' && (
          <TouchableOpacity
            style={s.fab}
            onPress={() => setTab('expenses')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="plus" size={26} color={isDarkMode ? '#000' : '#fff'} />
            <View style={s.fabRing} />
          </TouchableOpacity>
        )}

        {/* Bottom Navigation Bar */}
        <View style={s.nav}>
          {TABS.map(tItem => {
            const active = tab === tItem.id;
            return (
              <TouchableOpacity
                key={tItem.id}
                style={s.navItem}
                onPress={() => setTab(tItem.id)}
                activeOpacity={0.7}
              >
                {active && <View style={s.activePill} />}
                <MaterialCommunityIcons
                  name={(active ? tItem.iconActive : tItem.icon) as any}
                  size={24}
                  color={active ? C.secondary : C.outline}
                />
                <Text style={[s.navLabel, active && s.navLabelActive]}>
                  {tItem.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (C: Theme) => {
  const isDark = C.surface !== '#fbf9fa';
  const NAV_H = Platform.OS === 'ios' ? 80 : 64;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? '#050a14' : '#f5f4f8',
      alignItems: 'center',
    },
    shell: {
      flex: 1,
      width: '100%',
      ...(Platform.OS === 'web' ? { maxWidth: MAX_W } : {}),
      backgroundColor: C.surface,
      position: 'relative',
    },
    screen: {
      flex: 1,
      paddingBottom: NAV_H,
    },

    // Bottom Nav
    nav: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: NAV_H,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: C.cardBg,
      borderTopWidth: 1,
      borderTopColor: C.borderColor,
      paddingBottom: Platform.OS === 'ios' ? 20 : 4,
      ...Platform.select({
        web: {
          boxShadow: `0 -4px 32px ${C.glassShadow}`,
          backdropFilter: 'blur(24px)',
        },
        ios:     { boxShadow: '0px -2px 12px rgba(0,0,0,0.08)' },
        android: { elevation: 16 },
      }),
    },
    navItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      position: 'relative',
    },
    activePill: {
      position: 'absolute',
      top: 0,
      width: 32,
      height: 3,
      borderRadius: 2,
      backgroundColor: C.secondary,
    },
    navLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: C.outline,
      marginTop: 3,
      letterSpacing: 0.3,
    },
    navLabelActive: {
      color: C.secondary,
      fontWeight: '700',
    },

    // FAB
    fab: {
      position: 'absolute',
      bottom: NAV_H + 12,
      right: 20,
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: C.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      ...Platform.select({
        web:     { boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(65,102,86,0.4)' },
        ios:     { boxShadow: '0px 6px 16px rgba(0,0,0,0.2)' },
        android: { elevation: 8 },
      }),
    },
    fabRing: {
      position: 'absolute',
      top: -5,
      left: -5,
      right: -5,
      bottom: -5,
      borderRadius: 32,
      borderWidth: 2,
      borderColor: C.secondary,
      opacity: 0.25,
    },
  });
};
