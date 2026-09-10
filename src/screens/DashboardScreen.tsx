import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Platform
} from 'react-native';
import { AppContext, Theme } from '../context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CalculatorModal from '../components/CalculatorModal';

const CATEGORY_META: { [key: string]: { icon: string; color: string } } = {
  Groceries: { icon: 'cart-outline',                  color: '#10b981' },
  Utilities: { icon: 'flash-outline',                 color: '#f59e0b' },
  Dining:    { icon: 'silverware-fork-knife',          color: '#ef4444' },
  Travel:    { icon: 'car-outline',                    color: '#6366f1' },
  Rent:      { icon: 'home-outline',                   color: '#3b82f6' },
  Others:    { icon: 'dots-horizontal-circle-outline', color: '#8b5cf6' },
};

interface DashboardScreenProps {
  setActiveTab?: (tab: string) => void;
  navigation?: any;
}

export default function DashboardScreen({ setActiveTab, navigation }: DashboardScreenProps) {
  const context = useContext(AppContext);
  if (!context) return null;

  const { user, expenses, reminders, savingsGullakBalance, payReminder, t, isDarkMode, toggleTheme, C, setPrefilledAmount } = context;
  const [showCalc, setShowCalc] = useState(false);

  const name        = user?.name || 'User';
  const budgetLimit = user?.monthlyBudget || 0;
  const lang        = user?.preferredLanguage || 'en';

  const savingsName     = user?.savingsName || '';
  const savingsTarget   = user?.savingsTarget || 0;
  const savingsAchieved = user?.savingsAchieved || 0;
  const savingsPct      = savingsTarget > 0 ? Math.min(100, Math.round((savingsAchieved / savingsTarget) * 100)) : 0;

  const totalSpent  = expenses.filter(e => e.type === 'debit').reduce((s, e)  => s + e.amount, 0);
  const totalCredit = expenses.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
  const netSpent    = Math.max(0, totalSpent - totalCredit);
  const remaining   = Math.max(0, budgetLimit - netSpent);
  const pct         = Math.min(100, budgetLimit > 0 ? Math.round((netSpent / budgetLimit) * 100) : 0);
  const dailyLimit  = Math.max(0, Math.round(remaining / 30));

  const catTotals = Object.keys(CATEGORY_META).map(k => ({
    id: k, ...CATEGORY_META[k],
    amount: expenses.filter(e => e.category === k && e.type === 'debit').reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.amount > 0);

  const progressColor = pct >= 90 ? C.error : pct >= 70 ? '#f59e0b' : C.secondary;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' });
    } catch { return dateStr; }
  };

  const avatarLetter = name.charAt(0).toUpperCase();
  const s = getStyles(C);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.avatarWrap}
          onPress={() => setActiveTab?.('profile')}
          activeOpacity={0.8}
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={s.avatarImg} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Text style={s.avatarLetter}>{avatarLetter}</Text>
            </View>
          )}
          <View style={s.onlineDot} />
        </TouchableOpacity>

        <View style={s.greetBlock}>
          <Text style={s.greeting} numberOfLines={1}>
            {t('dash_greeting_en', { name })}
          </Text>
          <Text style={s.greetSub} numberOfLines={1}>{t('dash_subtitle_en')}</Text>
        </View>

        <View style={s.headerActions}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => navigation ? navigation.navigate('Calculator') : setShowCalc(true)}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="calculator-variant-outline" size={20} color={C.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={toggleTheme} activeOpacity={0.75}>
            <MaterialCommunityIcons name={isDarkMode ? 'weather-sunny' : 'weather-night'} size={20} color={C.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <CalculatorModal
          visible={showCalc}
          onClose={() => setShowCalc(false)}
          onAddValue={val => {
            setPrefilledAmount(val);
            if (navigation) navigation.navigate('Expenses');
            else setActiveTab?.('expenses');
          }}
        />
      </View>

      {/* ── Budget Hero Card ── */}
      <View style={s.budgetCard}>
        {/* Decorative glows */}
        <View style={s.glow1} />
        <View style={s.glow2} />

        <View style={s.budgetRow}>
          <View>
            <Text style={s.budgetLabel}>{t('total_budget')}</Text>
            <Text style={s.budgetAmount}>₹{budgetLimit.toLocaleString('en-IN')}</Text>
          </View>
          <View style={s.spentBadge}>
            <Text style={s.spentBadgeLabel}>Spent</Text>
            <Text style={s.spentBadgeValue}>{pct}%</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: progressColor }]} />
        </View>

        <View style={s.budgetStats}>
          <View style={s.statPill}>
            <MaterialCommunityIcons name="arrow-up-circle-outline" size={14} color={C.error} />
            <View>
              <Text style={s.statPillLabel}>{t('spent_so_far')}</Text>
              <Text style={[s.statPillValue, { color: C.error }]}>₹{netSpent.toLocaleString('en-IN')}</Text>
            </View>
          </View>
          <View style={s.statDivider} />
          <View style={s.statPill}>
            <MaterialCommunityIcons name="arrow-down-circle-outline" size={14} color={C.secondary} />
            <View>
              <Text style={s.statPillLabel}>{t('remaining')}</Text>
              <Text style={[s.statPillValue, { color: C.secondary }]}>₹{remaining.toLocaleString('en-IN')}</Text>
            </View>
          </View>
          <View style={s.statDivider} />
          <View style={s.statPill}>
            <MaterialCommunityIcons name="calendar-today" size={14} color={C.onSurfaceVariant} />
            <View>
              <Text style={s.statPillLabel}>{t('daily_limit')}</Text>
              <Text style={[s.statPillValue, { color: C.onSurface }]}>₹{dailyLimit.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={s.detailsBtn}
          onPress={() => navigation ? navigation.navigate('Expenses') : setActiveTab?.('expenses')}
          activeOpacity={0.85}
        >
          <Text style={s.detailsBtnText}>View Transactions</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={isDarkMode ? '#000' : '#fff'} />
        </TouchableOpacity>
      </View>

      {/* ── Quick Stats Row ── */}
      <View style={s.quickRow}>
        {/* Gupt Gullak */}
        <View style={[s.quickCard, s.gullakCard]}>
          <View style={[s.quickIcon, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
            <MaterialCommunityIcons name="piggy-bank" size={22} color="#d97706" />
          </View>
          <Text style={s.quickLabel}>{t('gullak_title')}</Text>
          <Text style={[s.quickValue, { color: '#d97706' }]}>₹{savingsGullakBalance.toLocaleString('en-IN')}</Text>
          <Text style={s.quickSub}>{t('gullak_saved')}</Text>
        </View>

        {/* Savings Goal */}
        <TouchableOpacity
          style={[s.quickCard, s.savingsQuickCard]}
          onPress={() => setActiveTab?.('profile')}
          activeOpacity={0.8}
        >
          <View style={[s.quickIcon, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
            <MaterialCommunityIcons name="target" size={22} color="#6366f1" />
          </View>
          <Text style={s.quickLabel}>{t('savings_goal')}</Text>
          {savingsTarget > 0 ? (
            <>
              <View style={s.miniBar}>
                <View style={[s.miniBarFill, { width: `${savingsPct}%` as any }]} />
              </View>
              <Text style={[s.quickValue, { color: '#6366f1', fontSize: 13 }]}>{savingsPct}% reached</Text>
            </>
          ) : (
            <Text style={[s.quickValue, { color: '#6366f1', fontSize: 12 }]}>Set a goal →</Text>
          )}
        </TouchableOpacity>

        {/* Rewards */}
        <TouchableOpacity
          style={[s.quickCard, s.rewardsQuickCard]}
          onPress={() => setActiveTab?.('spin')}
          activeOpacity={0.8}
        >
          <View style={[s.quickIcon, { backgroundColor: 'rgba(130,179,158,0.15)' }]}>
            <MaterialCommunityIcons name="star-circle" size={22} color={C.secondary} />
          </View>
          <Text style={s.quickLabel}>Rewards</Text>
          <Text style={[s.quickValue, { color: C.secondary }]}>{user?.rewardPoints || 0} pts</Text>
          <Text style={s.quickSub}>Spin to win →</Text>
        </TouchableOpacity>
      </View>

      {/* ── Reminders ── */}
      {reminders.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>{t('reminders_title')}</Text>
            <Text style={s.sectionBadge}>{reminders.length}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.remRow}>
            {reminders.map(item => (
              <View key={item.reminderId} style={s.reminderCard}>
                <View style={s.reminderTop}>
                  <View style={s.reminderIconBg}>
                    <MaterialCommunityIcons name="bell-ring-outline" size={16} color={C.error} />
                  </View>
                  <Text style={s.reminderTitle} numberOfLines={1}>{item.title}</Text>
                </View>
                <Text style={s.reminderAmt}>₹{item.amount.toLocaleString('en-IN')}</Text>
                <Text style={s.reminderDue}>Due: {formatDate(item.dueDate)}</Text>
                <TouchableOpacity
                  style={s.payBtn}
                  onPress={() => payReminder(item.reminderId)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="check-circle-outline" size={13} color="#fff" />
                  <Text style={s.payBtnText}>{t('btn_pay')}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {reminders.length === 0 && (
        <View style={s.allPaidBanner}>
          <MaterialCommunityIcons name="check-decagram" size={18} color={C.secondary} />
          <Text style={s.allPaidText}>{t('all_bills_paid')}</Text>
        </View>
      )}

      {/* ── Categories ── */}
      {catTotals.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>{t('categories_title')}</Text>
            <TouchableOpacity
              style={s.viewAllBtn}
              onPress={() => setActiveTab?.('expenses')}
              activeOpacity={0.75}
            >
              <Text style={s.viewAllText}>{t('view_all')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={C.secondary} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
            {catTotals.map(cat => (
              <View key={cat.id} style={s.catCard}>
                <View style={[s.catIconBg, { backgroundColor: cat.color + '18' }]}>
                  <MaterialCommunityIcons name={cat.icon as any} size={20} color={cat.color} />
                </View>
                <Text style={s.catName} numberOfLines={1}>{t('cat_' + cat.id.toLowerCase())}</Text>
                <Text style={[s.catAmt, { color: cat.color }]}>₹{cat.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Recent Activity ── */}
      <View style={s.section}>
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>{t('recent_activity')}</Text>
        </View>

        {expenses.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialCommunityIcons name="wallet-plus-outline" size={40} color={C.outline + '66'} />
            <Text style={s.emptyTitle}>{t('no_transactions')}</Text>
            <Text style={s.emptySub}>{t('no_transactions_sub')}</Text>
            <TouchableOpacity
              style={s.emptyBtn}
              onPress={() => setActiveTab?.('expenses')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              <Text style={s.emptyBtnText}>{t('btn_add_first')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {expenses.slice(0, 6).map(item => {
              const meta = CATEGORY_META[item.category] || CATEGORY_META.Others;
              const isDebit = item.type === 'debit';
              return (
                <View key={item.expenseId || item.id} style={s.txRow}>
                  <View style={[s.txIconBg, { backgroundColor: meta.color + '18' }]}>
                    <MaterialCommunityIcons
                      name={(isDebit ? meta.icon : 'arrow-down-circle-outline') as any}
                      size={18}
                      color={meta.color}
                    />
                  </View>
                  <View style={s.txInfo}>
                    <Text style={s.txTitle} numberOfLines={1}>{item.itemName}</Text>
                    <Text style={s.txMeta}>{t('cat_' + item.category.toLowerCase())} · {formatDate(item.date)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[s.txAmt, { color: isDebit ? C.error : C.secondary }]}>
                      {isDebit ? '−' : '+'}₹{item.amount.toLocaleString('en-IN')}
                    </Text>
                    <View style={[s.txTypeBadge, { backgroundColor: isDebit ? C.error + '18' : C.secondary + '18' }]}>
                      <Text style={[s.txTypeTxt, { color: isDebit ? C.error : C.secondary }]}>
                        {isDebit ? t('tx_debit') : t('tx_credit')}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const getStyles = (C: Theme) => {
  const isDark = C.surface !== '#fbf9fa';
  const glass = Platform.select({
    web:     { boxShadow: `0 4px 24px ${C.glassShadow}`, backdropFilter: 'blur(16px)' },
    ios:     { boxShadow: '0px 2px 12px rgba(0,0,0,0.08)' },
    android: { elevation: 2 },
  });

  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: C.surface },
    scroll: { flexGrow: 1, padding: 16, paddingTop: 12, paddingBottom: 24, gap: 16 },

    // ── Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 4,
    },
    avatarWrap: {
      width: 44, height: 44, borderRadius: 22,
      position: 'relative',
    },
    avatarImg: {
      width: 44, height: 44, borderRadius: 22,
      borderWidth: 2, borderColor: C.secondaryContainer,
    },
    avatarPlaceholder: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: C.primary,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: C.secondaryContainer,
    },
    avatarLetter: { fontSize: 18, fontWeight: '700', color: isDark ? '#000' : '#fff' },
    onlineDot: {
      position: 'absolute', bottom: 1, right: 1,
      width: 10, height: 10, borderRadius: 5,
      backgroundColor: C.secondary,
      borderWidth: 2, borderColor: C.surface,
    },
    greetBlock: { flex: 1 },
    greeting:   { fontSize: 15, fontWeight: '700', color: C.primary },
    greetSub:   { fontSize: 11, color: C.outline, marginTop: 1 },
    headerActions: { flexDirection: 'row', gap: 8 },
    iconBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: C.surfaceContainer,
      borderWidth: 1, borderColor: C.borderColor,
      alignItems: 'center', justifyContent: 'center',
    },

    // ── Budget Hero Card
    budgetCard: {
      backgroundColor: isDark ? '#0f172a' : C.primary,
      borderRadius: 24,
      padding: 20,
      gap: 14,
      overflow: 'hidden',
      position: 'relative',
      ...Platform.select({
        web:     { boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(10,20,34,0.3)' },
        ios:     { boxShadow: '0px 8px 24px rgba(0,0,0,0.2)' },
        android: { elevation: 6 },
      }),
    },
    glow1: {
      position: 'absolute', top: -30, right: -30,
      width: 120, height: 120, borderRadius: 60,
      backgroundColor: isDark ? 'rgba(130,179,158,0.12)' : 'rgba(255,255,255,0.08)',
    },
    glow2: {
      position: 'absolute', bottom: -20, left: 60,
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: isDark ? 'rgba(130,179,158,0.06)' : 'rgba(255,255,255,0.05)',
    },
    budgetRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    budgetLabel: { fontSize: 11, fontWeight: '600', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.65)', letterSpacing: 0.5, textTransform: 'uppercase' },
    budgetAmount: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 2, letterSpacing: -0.5 },
    spentBadge: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 12, padding: 10,
      alignItems: 'center',
    },
    spentBadgeLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },
    spentBadgeValue: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 2 },
    progressBg:   { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    budgetStats:  { flexDirection: 'row', alignItems: 'center' },
    statPill:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    statDivider:  { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 4 },
    statPillLabel:{ fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.3 },
    statPillValue:{ fontSize: 13, fontWeight: '700', marginTop: 1 },
    detailsBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 12, paddingVertical: 12,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    },
    detailsBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

    // ── Quick Stats Row
    quickRow:  { flexDirection: 'row', gap: 10 },
    quickCard: {
      flex: 1, borderRadius: 20, padding: 14,
      backgroundColor: C.cardBg,
      borderWidth: 1, borderColor: C.borderColor,
      gap: 4, ...glass,
    },
    gullakCard:      { borderColor: 'rgba(217,119,6,0.25)' },
    savingsQuickCard: {},
    rewardsQuickCard: {},
    quickIcon:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    quickLabel: { fontSize: 10, fontWeight: '600', color: C.outline, letterSpacing: 0.3 },
    quickValue: { fontSize: 14, fontWeight: '800', color: C.primary },
    quickSub:   { fontSize: 9, color: C.outline, marginTop: 1 },
    miniBar:     { height: 4, backgroundColor: C.surfaceContainer, borderRadius: 2, overflow: 'hidden', marginVertical: 4 },
    miniBarFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 2 },

    // ── Section
    section:    { gap: 10 },
    sectionHead:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle:{ fontSize: 16, fontWeight: '700', color: C.primary, flex: 1 },
    sectionBadge:{
      backgroundColor: C.error, borderRadius: 10,
      paddingHorizontal: 7, paddingVertical: 2,
      minWidth: 20, alignItems: 'center',
    },
    viewAllBtn:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
    viewAllText: { fontSize: 12, fontWeight: '600', color: C.secondary },

    // ── Reminders
    remRow:       { gap: 10, paddingRight: 4 },
    reminderCard: {
      width: 152,
      backgroundColor: C.cardBg,
      borderRadius: 18, borderWidth: 1,
      borderColor: C.borderColor,
      padding: 14, gap: 4, ...glass,
    },
    reminderTop:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    reminderIconBg:{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.error + '18', alignItems: 'center', justifyContent: 'center' },
    reminderTitle: { fontSize: 12, fontWeight: '700', color: C.primary, flex: 1 },
    reminderAmt:   { fontSize: 17, fontWeight: '800', color: C.primary },
    reminderDue:   { fontSize: 10, color: C.outline },
    payBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 4, backgroundColor: C.primary,
      borderRadius: 10, paddingVertical: 8, marginTop: 4,
    },
    payBtnText: { fontSize: 11, fontWeight: '700', color: isDark ? '#000' : '#fff' },

    allPaidBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: isDark ? 'rgba(130,179,158,0.06)' : 'rgba(195,236,215,0.15)',
      borderRadius: 14, borderWidth: 1, borderColor: C.secondary + '33',
      paddingVertical: 12, paddingHorizontal: 16,
    },
    allPaidText: { fontSize: 13, fontWeight: '600', color: C.secondary },

    // ── Category chips
    catCard: {
      width: 100,
      backgroundColor: C.cardBg,
      borderRadius: 18, borderWidth: 1,
      borderColor: C.borderColor,
      padding: 12, gap: 4, ...glass,
    },
    catIconBg: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    catName:   { fontSize: 11, fontWeight: '600', color: C.onSurfaceVariant },
    catAmt:    { fontSize: 12, fontWeight: '700' },

    // ── Transaction rows
    txRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: C.cardBg,
      borderRadius: 16, borderWidth: 1,
      borderColor: C.borderColor,
      padding: 12, ...glass,
    },
    txIconBg:   { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    txInfo:     { flex: 1, gap: 2 },
    txTitle:    { fontSize: 13, fontWeight: '700', color: C.onSurface },
    txMeta:     { fontSize: 10, color: C.outline },
    txAmt:      { fontSize: 14, fontWeight: '800' },
    txTypeBadge:{ borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3 },
    txTypeTxt:  { fontSize: 9, fontWeight: '700' },

    // ── Empty state
    emptyState: {
      alignItems: 'center', paddingVertical: 32, gap: 8,
      backgroundColor: isDark ? 'rgba(130,179,158,0.04)' : 'rgba(195,236,215,0.08)',
      borderRadius: 20, borderWidth: 1, borderStyle: 'dashed',
      borderColor: C.secondary + '44',
    },
    emptyTitle:   { fontSize: 15, fontWeight: '700', color: C.primary, textAlign: 'center' },
    emptySub:     { fontSize: 12, color: C.outline, textAlign: 'center', lineHeight: 18 },
    emptyBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: C.secondary,
      paddingVertical: 10, paddingHorizontal: 20,
      borderRadius: 12, marginTop: 4,
    },
    emptyBtnText: { fontSize: 13, fontWeight: '700', color: isDark ? '#000' : '#fff' },
  });
};
