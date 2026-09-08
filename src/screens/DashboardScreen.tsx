import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Platform
} from 'react-native';
import { AppContext, Theme } from '../context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CalculatorModal from '../components/CalculatorModal';

const CATEGORY_META: { [key: string]: { icon: string; nameHi: string } } = {
  Groceries: { icon: 'cart-outline', nameHi: 'किराना' },
  Utilities: { icon: 'flash-outline', nameHi: 'बिजली-पानी' },
  Dining: { icon: 'silverware-fork-knife', nameHi: 'बाहर खाना' },
  Travel: { icon: 'car-outline', nameHi: 'यात्रा' },
  Rent: { icon: 'home-outline', nameHi: 'किराया' },
  Others: { icon: 'dots-horizontal-circle-outline', nameHi: 'अन्य' },
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

  const name = user?.name || 'User';
  const budgetLimit = user?.monthlyBudget || 0;
  const lang = user?.preferredLanguage || 'en';

  const savingsName = user?.savingsName || '';
  const savingsTarget = user?.savingsTarget || 0;
  const savingsAchieved = user?.savingsAchieved || 0;
  const savingsPct = savingsTarget > 0 ? Math.min(100, Math.round((savingsAchieved / savingsTarget) * 100)) : 0;

  // Filter current month expenses
  const totalSpent = expenses.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
  const totalCredit = expenses.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
  const netSpent = Math.max(0, totalSpent - totalCredit);
  const remaining = Math.max(0, budgetLimit - netSpent);
  const pct = Math.min(100, budgetLimit > 0 ? Math.round((netSpent / budgetLimit) * 100) : 0);
  const dailyLimit = Math.max(0, Math.round(remaining / 30));

  const catTotals = Object.keys(CATEGORY_META).map(k => ({
    id: k, ...CATEGORY_META[k],
    amount: expenses.filter(e => e.category === k && e.type === 'debit').reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.amount > 0);

  const greeting = t('dash_greeting_en', { name });
  const greetSub = t('dash_subtitle_en');

  const progressColor = pct >= 90 ? C.error : pct >= 70 ? C.tertiary : C.secondary;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const s = getStyles(C);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* ── Header ─────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.profileRow}>
          <Image
            style={s.avatar}
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRoX1uo6XD4NZ_VU7C55OhviPRyXD_i6NN-sJh8L5USRpg3L0eW_-RL0NOuFajoOp58TmDnBkGS3eAzRnm3APY4rPIE5thFZFTc6uwT743PElFUEzPBBLVDeddM9uBF_RoEPzT4b7_deoChSmkQp8o2yrO7P3H8jwY22oHTtXnLCuhLeK7ECSO-xI2rN1dOA7ebyO5uG5RcOimn2jMmHrjQez2KWzVmsAsVEWBQ3ZlAyRmGYh_DFLFU5MmWUq2pfJSVJnXSY6rOts' }}
          />
          <View style={s.badge} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={s.greeting}>{greeting}</Text>
            <Text style={s.greetSub}>{greetSub}</Text>
          </View>
        </View>
        <View style={s.headerIcons}>
          {/* Quick calculator toggler shortcut */}
          <TouchableOpacity 
            style={s.iconBtn} 
            onPress={() => navigation ? navigation.navigate('Calculator') : setShowCalc(true)} 
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="calculator" size={20} color={C.primary} />
          </TouchableOpacity>
          {/* Quick theme toggler shortcut */}
          <TouchableOpacity style={s.iconBtn} onPress={toggleTheme} activeOpacity={0.75}>
            <MaterialCommunityIcons name={isDarkMode ? "weather-sunny" : "weather-night"} size={20} color={C.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={C.primary} />
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

      {/* ── Budget Bento Card ───────────────────────── */}
      <View style={s.budgetCard}>
        <View style={s.budgetGlow} />
        <View style={s.budgetTop}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.budgetAmount}>₹{budgetLimit.toLocaleString('en-IN')}</Text>
              <MaterialCommunityIcons name="wallet-outline" size={18} color={C.secondary} />
            </View>
            <Text style={s.budgetLabel}>{t('total_budget')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.spentLabel}>{t('spent_so_far')}</Text>
            <Text style={s.spentAmount}>
              ₹{netSpent.toLocaleString('en-IN')}{' '}
              <Text style={s.spentPct}>/ {pct}%</Text>
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: progressColor }]} />
        </View>

        <View style={s.budgetFooter}>
          <View style={{ flexDirection: 'row', gap: 18 }}>
            <View>
              <Text style={s.statLabel}>{t('remaining')}</Text>
              <Text style={[s.statValue, { color: C.secondary }]}>₹{remaining.toLocaleString('en-IN')}</Text>
            </View>
            <View>
              <Text style={s.statLabel}>{t('daily_limit')}</Text>
              <Text style={[s.statValue, { color: C.primary }]}>₹{dailyLimit.toLocaleString('en-IN')}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.detailsBtn} onPress={() => navigation ? navigation.navigate('Expenses') : setActiveTab?.('expenses')}>
            <Text style={s.detailsBtnText}>{t('btn_details')}</Text>
            <MaterialCommunityIcons name="arrow-right" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Gupt Gullak Component (Piggy Bank) ────────── */}
      <View style={s.gullakCard}>
        <View style={s.gullakLeft}>
          <View style={s.gullakIconBg}>
            <MaterialCommunityIcons name="piggy-bank" size={26} color={isDarkMode ? '#fbbf24' : '#d97706'} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={s.gullakTitle}>{t('gullak_title')}</Text>
            <Text style={s.gullakSub}>{t('gullak_sub')}</Text>
          </View>
        </View>
        <View style={s.gullakRight}>
          <Text style={s.gullakBalance}>₹{savingsGullakBalance.toLocaleString('en-IN')}</Text>
          <View style={s.gullakCoinBadge}>
            <MaterialCommunityIcons name={"cash" as any} size={12} color="#fff" />
            <Text style={s.gullakBadgeText}>{t('gullak_saved')}</Text>
          </View>
        </View>
      </View>

      {/* ── Important Reminders Widget (महत्वपूर्ण रिमाइंडर्स) ── */}
      <View style={s.section}>
        <View style={s.sectionHead}>
          <View>
            <Text style={s.sectionTitle}>{t('reminders_title')}</Text>
            <Text style={s.sectionTitleHi}>{t('reminders_subtitle')}</Text>
          </View>
        </View>

        {reminders.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.remindersScroll}>
            {reminders.map(item => (
              <View key={item.reminderId} style={s.reminderChip}>
                <View style={s.reminderHeader}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color={C.tertiary} />
                  <Text style={s.reminderTitleText} numberOfLines={1}>{item.title}</Text>
                </View>
                <Text style={s.reminderAmount}>₹{item.amount.toLocaleString('en-IN')}</Text>
                <Text style={s.reminderDueDate}>{t('due_date_label')}{formatDate(item.dueDate)}</Text>
                
                <TouchableOpacity
                  style={s.payBtn}
                  onPress={() => payReminder(item.reminderId)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="check" size={14} color="#fff" style={{ marginRight: 2 }} />
                  <Text style={s.payBtnText}>{t('btn_pay')}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={s.remindersEmptyCard}>
            <MaterialCommunityIcons name="check-decagram-outline" size={24} color={C.secondary} />
            <Text style={s.remindersEmptyText}>{t('all_bills_paid')}</Text>
          </View>
        )}
      </View>

      {/* ── Savings Goal ────────────────────────────── */}
      <View style={s.savingsCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <View>
            <Text style={s.savingsTitle}>{t('savings_goal')}</Text>
            <Text style={s.savingsTitleHi}>{t('savings_goal_hi')}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation ? navigation.navigate('Profile') : setActiveTab?.('profile')} style={s.savingsEditBtn}>
            <MaterialCommunityIcons name="pencil-outline" size={16} color={C.tertiary} />
          </TouchableOpacity>
        </View>

        {savingsTarget > 0 ? (
          <View>
            <View style={{ marginVertical: 10 }}>
              <View style={s.savingsRow}>
                <Text style={s.savingsName}>{savingsName || t('unnamed_goal')}</Text>
                <Text style={s.savingsTarget}>₹{savingsTarget.toLocaleString('en-IN')}</Text>
              </View>
              <View style={s.savingsBarBg}>
                <View style={[s.savingsBarFill, { width: `${savingsPct}%` }]} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.savingsPct}>{t('reached_pct', { pct: savingsPct })}</Text>
              <Text style={s.savingsAchieved}>{t('saved_amount', { amount: savingsAchieved.toLocaleString('en-IN') })}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={s.savingsPlaceholder} onPress={() => navigation ? navigation.navigate('Profile') : setActiveTab?.('profile')} activeOpacity={0.8}>
            <MaterialCommunityIcons name="piggy-bank-outline" size={24} color={C.tertiary} style={{ marginRight: 4 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.savingsPlaceholderTitle}>{t('no_savings_goal')}</Text>
              <Text style={s.savingsPlaceholderSub}>{t('no_savings_goal_sub')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={C.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Savings Rewards Game ────────────────────── */}
      <View style={s.rewardsCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="star-circle" size={24} color={C.secondary} />
              <Text style={s.rewardsTitle}>{t('reward_stars_title')}</Text>
            </View>
            <Text style={s.rewardsPointsText}>
              {t('reward_stars_desc', { points: user?.rewardPoints || 0 })}
            </Text>
          </View>
          <TouchableOpacity 
            style={s.rewardsBtn} 
            onPress={() => navigation ? navigation.navigate('Spin') : setActiveTab?.('spin')}
            activeOpacity={0.8}
          >
            <Text style={s.rewardsBtnText}>{t('btn_spin_now')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={C.onSecondaryContainer} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Categories ──────────────────────────────── */}
      <View style={s.section}>
        <View style={s.sectionHead}>
          <View>
            <Text style={s.sectionTitle}>{t('categories_title')}</Text>
            <Text style={s.sectionTitleHi}>{t('categories_subtitle')}</Text>
          </View>
          <TouchableOpacity style={s.viewAll} onPress={() => navigation ? navigation.navigate('Expenses') : setActiveTab?.('expenses')}>
            <Text style={s.viewAllText}>{t('view_all')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={C.secondary} />
          </TouchableOpacity>
        </View>

        {catTotals.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 8 }}>
            {catTotals.map(cat => (
              <View key={cat.id} style={[s.catCard, { borderBottomColor: C.secondary, borderBottomWidth: 3 }]}>
                <View style={[s.catIconBg, { backgroundColor: isDarkMode ? 'rgba(130,179,158,0.15)' : 'rgba(65,102,86,0.1)' }]}>
                  <MaterialCommunityIcons name={cat.icon as any} size={20} color={C.secondary} />
                </View>
                <Text style={s.catName}>{t('cat_' + cat.id.toLowerCase())}</Text>
                <Text style={[s.catAmount, { color: C.secondary }]}>₹{cat.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={s.empty}>
            <MaterialCommunityIcons name="cart-plus" size={28} color={C.outline + '88'} />
            <Text style={s.emptyText}>{t('no_expenses_yet')}</Text>
          </View>
        )}
      </View>

      {/* ── Recent Activity ─────────────────────────── */}
      <View style={s.section}>
        <View style={s.sectionHead}>
          <View>
            <Text style={s.sectionTitle}>{t('recent_activity')}</Text>
            <Text style={s.sectionTitleHi}>{t('recent_activity_subtitle')}</Text>
          </View>
        </View>

        {expenses.length === 0 ? (
          <View style={s.welcomeEmpty}>
            <MaterialCommunityIcons name="wallet-plus-outline" size={40} color={C.secondary + 'aa'} />
            <Text style={s.welcomeTitle}>{t('no_transactions')}</Text>
            <Text style={s.welcomeSub}>{t('no_transactions_sub')}</Text>
            <TouchableOpacity style={s.welcomeBtn} onPress={() => navigation ? navigation.navigate('Expenses') : setActiveTab?.('expenses')} activeOpacity={0.85}>
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              <Text style={s.welcomeBtnText}>{t('btn_add_first')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {expenses.slice(0, 6).map(item => {
              const meta = CATEGORY_META[item.category] || CATEGORY_META.Others;
              const isDebit = item.type === 'debit';
              return (
                <View key={item.expenseId || item.id} style={s.txRow}>
                  <View style={[s.txIconBg, { backgroundColor: isDarkMode ? 'rgba(130,179,158,0.15)' : 'rgba(65,102,86,0.1)' }]}>
                    <MaterialCommunityIcons name={isDebit ? meta.icon as any : 'piggy-bank-outline'} size={18} color={C.secondary} />
                  </View>
                  <View style={s.txInfo}>
                    <Text style={s.txTitle} numberOfLines={1}>{item.itemName}</Text>
                    <Text style={s.txDate}>{formatDate(item.date)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[s.txAmount, { color: C.onSurface }]}>
                      {isDebit ? '-' : '+'}₹{item.amount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={[s.txType, { color: isDebit ? C.error : C.secondary }]}>
                      {isDebit ? t('tx_debit') : t('tx_credit')}
                    </Text>
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
  const glass = Platform.select({
    web: { boxShadow: `0 8px 32px ${C.glassShadow}`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' },
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 14 },
    android: { elevation: 2 },
  });

  const isDark = C.surface !== '#fbf9fa';

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.surface },
    scroll: { flexGrow: 1, padding: 20, paddingTop: 16, paddingBottom: 24, gap: 0 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
    profileRow: { flexDirection: 'row', alignItems: 'center', flex: 1, position: 'relative' },
    avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: C.secondaryContainer },
    badge: { position: 'absolute', bottom: 0, left: 30, width: 11, height: 11, borderRadius: 6, backgroundColor: C.secondary, borderWidth: 2, borderColor: C.surface },
    greeting: { fontSize: 15, fontWeight: '700', color: C.primary },
    greetSub: { fontSize: 11, color: C.outline, opacity: 0.8, marginTop: 1 },
    headerIcons: { flexDirection: 'row', gap: 6 },
    iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.borderColor, alignItems: 'center', justifyContent: 'center' },
    
    // Budget Card
    budgetCard: { backgroundColor: C.cardBg, borderRadius: 24, borderWidth: 1, borderColor: C.borderColor, padding: 18, marginBottom: 14, position: 'relative', overflow: 'hidden', ...glass },
    budgetGlow: { position: 'absolute', top: 0, right: 0, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(195,236,215,0.12)', transform: [{ translateX: 40 }, { translateY: -40 }] },
    budgetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
    budgetAmount: { fontSize: 20, fontWeight: '700', color: C.primary },
    budgetLabel: { fontSize: 11, color: C.outline, marginTop: 2 },
    spentLabel: { fontSize: 9, fontWeight: '700', color: C.onSurfaceVariant, letterSpacing: 0.5 },
    spentAmount: { fontSize: 16, fontWeight: '700', color: C.onSurface, marginTop: 2 },
    spentPct: { fontSize: 12, color: C.outline, fontWeight: '400' },
    progressBg: { height: 12, backgroundColor: C.surfaceContainer, borderRadius: 6, overflow: 'hidden', marginBottom: 14 },
    progressFill: { height: '100%', borderRadius: 6 },
    budgetFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.outlineVariant + '22', paddingTop: 12 },
    statLabel: { fontSize: 9, fontWeight: '700', color: C.outline, letterSpacing: 0.5 },
    statValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
    detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
    detailsBtnText: { fontSize: 12, fontWeight: '600', color: isDark ? '#000' : '#fff' },

    // Gupt Gullak Card
    gullakCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.08)' : 'rgba(251, 191, 36, 0.09)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(251, 191, 36, 0.25)' : 'rgba(217, 119, 6, 0.25)',
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      ...glass
    },
    gullakLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    gullakIconBg: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.12)' : 'rgba(217, 119, 6, 0.15)',
      alignItems: 'center',
      justifyContent: 'center'
    },
    gullakTitle: { fontSize: 14, fontWeight: '700', color: isDark ? '#f59e0b' : '#b45309' },
    gullakSub: { fontSize: 10, color: C.outline, marginTop: 2 },
    gullakRight: { alignItems: 'flex-end' },
    gullakBalance: { fontSize: 18, fontWeight: '800', color: isDark ? '#f59e0b' : '#b45309' },
    gullakCoinBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: isDark ? '#d97706' : '#d97706',
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginTop: 4
    },
    gullakBadgeText: { fontSize: 8, fontWeight: '700', color: '#fff' },

    // Reminders Widget styling
    remindersScroll: { gap: 12, paddingRight: 8, paddingBottom: 6 },
    reminderChip: {
      width: 160,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.borderColor,
      borderRadius: 16,
      padding: 12,
      ...glass
    },
    reminderHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
    reminderTitleText: { fontSize: 12, fontWeight: '700', color: C.primary, flex: 1 },
    reminderAmount: { fontSize: 16, fontWeight: '800', color: C.primary, marginBottom: 2 },
    reminderDueDate: { fontSize: 9, color: C.outline, marginBottom: 8 },
    payBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.primary,
      borderRadius: 8,
      paddingVertical: 6,
      width: '100%'
    },
    payBtnText: { fontSize: 10, fontWeight: '700', color: isDark ? '#000' : '#fff' },
    remindersEmptyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(130,179,158,0.06)' : 'rgba(195,236,215,0.1)',
      borderRadius: 16,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: C.secondary + '44',
      paddingVertical: 18
    },
    remindersEmptyText: { fontSize: 12, fontWeight: '600', color: C.secondary },

    // Savings Card
    savingsCard: { backgroundColor: C.cardBg, borderRadius: 24, borderWidth: 1, borderColor: C.borderColor, borderLeftWidth: 4, borderLeftColor: C.tertiaryContainer, padding: 16, marginBottom: 22, ...glass },
    savingsTitle: { fontSize: 14, fontWeight: '700', color: C.tertiary },
    savingsTitleHi: { fontSize: 11, color: C.outline, opacity: 0.7 },
    savingsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    savingsName: { fontSize: 13, fontWeight: '500', color: C.onSurface },
    savingsTarget: { fontSize: 13, fontWeight: '700', color: C.tertiary },
    savingsBarBg: { height: 8, backgroundColor: 'rgba(181,172,132,0.15)', borderRadius: 4, overflow: 'hidden' },
    savingsBarFill: { height: '100%', backgroundColor: C.tertiaryContainer, borderRadius: 4 },
    savingsPct: { fontSize: 10, fontWeight: '700', color: C.tertiary },
    savingsAchieved: { fontSize: 10, fontWeight: '600', color: C.outline },
    savingsEditBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(181,172,132,0.12)' },
    savingsPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(181,172,132,0.06)', borderRadius: 16, padding: 12, marginTop: 8 },
    savingsPlaceholderTitle: { fontSize: 13, fontWeight: '700', color: C.tertiary },
    savingsPlaceholderSub: { fontSize: 11, color: C.outline, marginTop: 2 },
    
    // Rewards Game Bento Card
    rewardsCard: { backgroundColor: C.cardBg, borderRadius: 24, borderWidth: 1, borderColor: C.borderColor, borderLeftWidth: 4, borderLeftColor: C.secondary, padding: 16, marginBottom: 22, ...glass },
    rewardsTitle: { fontSize: 14, fontWeight: '700', color: C.secondary },
    rewardsPointsText: { fontSize: 13, fontWeight: '600', color: C.onSurface, marginTop: 6 },
    rewardsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.secondary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14 },
    rewardsBtnText: { fontSize: 12, fontWeight: '700', color: C.onSecondaryContainer },
    
    // Sections
    section: { marginBottom: 22 },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: C.primary },
    sectionTitleHi: { fontSize: 11, color: C.outline, opacity: 0.7 },
    viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    viewAllText: { fontSize: 13, fontWeight: '600', color: C.secondary },
    
    // Category chips
    catCard: { minWidth: 110, backgroundColor: C.cardBg, borderRadius: 18, borderWidth: 1, borderColor: C.borderColor, padding: 12, ...glass },
    catIconBg: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    catName: { fontSize: 12, fontWeight: '600', color: C.onSurface },
    catAmount: { fontSize: 12, fontWeight: '700', marginTop: 2 },
    empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 8, backgroundColor: C.cardBg + '55', borderRadius: 16, borderWidth: 1, borderColor: C.borderColor },
    emptyText: { fontSize: 13, color: C.outline, textAlign: 'center' },
    
    // Transaction row
    txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.borderColor, padding: 12, gap: 12, ...glass },
    txIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    txInfo: { flex: 1 },
    txTitle: { fontSize: 13, fontWeight: '700', color: C.onSurface },
    txDate: { fontSize: 9, color: C.outline, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
    txAmount: { fontSize: 13, fontWeight: '700' },
    txType: { fontSize: 9, fontWeight: '600', marginTop: 2 },
    welcomeEmpty: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16, gap: 10, backgroundColor: isDark ? 'rgba(130,179,158,0.06)' : 'rgba(195,236,215,0.08)', borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: C.secondary + '44' },
    welcomeTitle: { fontSize: 16, fontWeight: '700', color: C.primary, textAlign: 'center' },
    welcomeSub: { fontSize: 12, color: C.outline, textAlign: 'center', lineHeight: 18 },
    welcomeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, backgroundColor: C.secondary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
    welcomeBtnText: { fontSize: 13, fontWeight: '700', color: isDark ? '#000' : '#fff' },
  });
};
