import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { AppContext, Theme } from '../context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

const getCatMeta = (C: Theme): { [key: string]: { color: string; hi: string } } => ({
  Groceries: { color: C.secondary, hi: 'किराना' },
  Utilities: { color: C.tertiary, hi: 'बिजली-पानी' },
  Dining: { color: C.error, hi: 'बाहर खाना' },
  Travel: { color: C.primary, hi: 'यात्रा' },
  Rent: { color: '#3b82f6', hi: 'किराया' },
  Others: { color: C.outline, hi: 'अन्य' },
});

interface PriceHistoryItem {
  month: string;
  averagePrice: number;
  totalSpent: number;
  count: number;
}

export default function AnalyticsScreen() {
  const context = useContext(AppContext);
  if (!context) return null;

  const { expenses, user, t, C } = context;
  const lang = user?.preferredLanguage || 'en';
  const isDark = C.surface !== '#fbf9fa';

  const totalDebit = expenses.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
  const totalCredit = expenses.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
  const net = totalDebit - totalCredit;

  // --- Price history search states ---
  const [searchItem, setSearchItem] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);

  const handleSearchPriceHistory = async () => {
    if (!searchItem.trim()) return;
    try {
      setIsSearching(true);
      const res = await axios.get(`/api/analytics/price-history?item=${encodeURIComponent(searchItem.trim())}`);
      if (res.data.success) {
        setPriceHistory(res.data.history || []);
      }
    } catch (e) {
      console.log('Price history search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  // Group by category
  const catTotals = Object.keys(getCatMeta(C)).map(k => {
    const meta = getCatMeta(C)[k];
    const amount = expenses.filter(e => e.category === k && e.type === 'debit').reduce((s, e) => s + e.amount, 0);
    return { id: k, ...meta, amount };
  }).filter(c => c.amount > 0);

  const maxCat = catTotals.reduce((max, c) => c.amount > max ? c.amount : max, 0);

  // Group by month (last 4 months)
  const monthlyMap: { [key: string]: number } = {};
  const currentYear = new Date().getFullYear();
  
  // Initialize last 4 months
  for (let i = 3; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mLabel = d.toLocaleString('en-US', { month: 'short' });
    const key = `${mLabel} ${d.getFullYear()}`;
    monthlyMap[key] = 0;
  }

  expenses.forEach(e => {
    try {
      const d = new Date(e.date);
      const mLabel = d.toLocaleString('en-US', { month: 'short' });
      const key = `${mLabel} ${d.getFullYear()}`;
      if (monthlyMap[key] !== undefined && e.type === 'debit') {
        monthlyMap[key] += e.amount;
      }
    } catch {
      // ignore
    }
  });

  const monthlyData = Object.keys(monthlyMap).map(k => {
    const parts = k.split(' ');
    // Localize Month names
    const m = parts[0];
    const localizedMonth = t(m.toLowerCase() + '_short');
    return {
      label: `${localizedMonth} ${parts[1].slice(2)}`,
      amount: monthlyMap[k]
    };
  });

  const maxMonth = Math.max(...monthlyData.map(m => m.amount), 1);
  const averageSpent = Math.round(monthlyData.reduce((s, m) => s + m.amount, 0) / monthlyData.length);

  const s = getStyles(C);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.pageTitleRow}>
          <Text style={s.pageTitle}>{t('analytics_title')}</Text>
          <Text style={s.pageSub}>{t('analytics_subtitle')}</Text>
        </View>

        {/* Overview cards */}
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { borderLeftColor: C.secondary }]}>
            <Text style={s.summaryLabel}>{t('total_debits')}</Text>
            <Text style={[s.summaryVal, { color: C.secondary }]}>₹{totalDebit.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[s.summaryCard, { borderLeftColor: C.tertiary }]}>
            <Text style={s.summaryLabel}>{t('total_credits')}</Text>
            <Text style={[s.summaryVal, { color: C.tertiary }]}>₹{totalCredit.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[s.summaryCard, { borderLeftColor: C.primary }]}>
            <Text style={s.summaryLabel}>{t('net_spending')}</Text>
            <Text style={[s.summaryVal, { color: C.primary }]}>₹{net.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* 4-Month Trend Chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{t('spending_trend')}</Text>
          <Text style={s.cardSub}>{t('spending_trend_hi')}</Text>
          
          <View style={s.chart}>
            <View style={s.yAxis}>
              <Text style={s.yLabel}>₹{(maxMonth/1000).toFixed(0)}k</Text>
              <Text style={s.yLabel}>₹{(maxMonth/2000).toFixed(0)}k</Text>
              <Text style={s.yLabel}>₹0</Text>
            </View>

            <View style={s.bars}>
              {monthlyData.map((m, idx) => {
                const fillPct = Math.round((m.amount / maxMonth) * 100);
                const active = idx === monthlyData.length - 1;
                return (
                  <View key={m.label} style={s.barCol}>
                    <Text style={[s.barVal, active && s.barValActive]}>₹{m.amount > 0 ? (m.amount/1000).toFixed(1) + 'k' : '0'}</Text>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, active && s.barFillActive, { height: `${fillPct}%` }]} />
                    </View>
                    <Text style={[s.barLabel, active && s.barLabelActive]} numberOfLines={1}>{m.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={s.trendBadge}>
            <MaterialCommunityIcons name="finance" size={16} color={C.secondary} />
            <Text style={s.trendText}>
              {t('average_spent', { avg: averageSpent.toLocaleString('en-IN') })}
            </Text>
          </View>
        </View>

        {/* Item Price History search tracking */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{t('price_tracking_title')}</Text>
          <Text style={s.cardSub}>{t('price_tracking_subtitle')}</Text>

          <View style={s.searchRow}>
            <TextInput
              style={s.searchInput}
              placeholder={t('price_search_placeholder')}
              placeholderTextColor={C.outline + '88'}
              value={searchItem}
              onChangeText={setSearchItem}
              autoCapitalize="none"
            />
            <TouchableOpacity style={s.searchBtn} onPress={handleSearchPriceHistory} disabled={isSearching}>
              {isSearching ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="magnify" size={18} color={isDark ? '#000' : '#fff'} />
                  <Text style={[s.searchBtnText, { color: isDark ? '#000' : '#fff' }]}>{t('btn_search')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {priceHistory.length > 0 ? (
            <View>
              <Text style={s.priceHistTitle}>{searchItem} - {t('price_history_title')}</Text>
              
              <View style={s.priceChart}>
                {priceHistory.map((item, idx) => {
                  const maxHistAmt = Math.max(...priceHistory.map(h => h.averagePrice), 1);
                  const fillPct = Math.round((item.averagePrice / maxHistAmt) * 100);
                  const parts = item.month.split(' ');
                  const localizedMonth = t(parts[0].toLowerCase() + '_short') || parts[0];
                  return (
                    <View key={item.month} style={s.priceBarCol}>
                      <Text style={s.priceBarVal}>₹{Math.round(item.averagePrice)}</Text>
                      <View style={s.priceBarTrack}>
                        <View style={[s.priceBarFill, { height: `${fillPct}%` }]} />
                      </View>
                      <Text style={s.priceBarLabel}>{localizedMonth}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={s.priceStats}>
                <View style={s.priceStatBox}>
                  <Text style={s.priceStatLabel}>{t('total_spending')}</Text>
                  <Text style={s.priceStatVal}>₹{priceHistory.reduce((acc, cur) => acc + cur.totalSpent, 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={s.priceStatBox}>
                  <Text style={s.priceStatLabel}>{t('purchase_count')}</Text>
                  <Text style={s.priceStatVal}>{priceHistory.reduce((acc, cur) => acc + cur.count, 0)} {t('times_label')}</Text>
                </View>
              </View>
            </View>
          ) : (
            searchItem.trim() !== '' && !isSearching && (
              <View style={s.priceEmptyBox}>
                <MaterialCommunityIcons name="information-outline" size={18} color={C.outline} />
                <Text style={s.priceEmptyText}>{t('no_price_history')}</Text>
              </View>
            )
          )}
        </View>

        {/* Category breakdown */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{t('category_breakdown')}</Text>
          <Text style={s.cardSub}>{t('category_breakdown_hi')}</Text>

          {catTotals.length > 0 ? (
            <View style={s.breakdown}>
              {catTotals.map(cat => {
                const pct = Math.round((cat.amount / totalDebit) * 100);
                return (
                  <View key={cat.id} style={s.bdRow}>
                    <View style={s.bdMeta}>
                      <View style={[s.bdDot, { backgroundColor: cat.color }]} />
                      <Text style={s.bdName}>{t('cat_' + cat.id.toLowerCase())}</Text>
                      <Text style={s.bdAmt}>₹{cat.amount.toLocaleString('en-IN')}</Text>
                      <Text style={[s.bdPct, { color: cat.color }]}>{pct}%</Text>
                    </View>
                    <View style={s.bdBarBg}>
                      <View style={[s.bdBarFill, { backgroundColor: cat.color, width: `${pct}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="chart-pie" size={24} color={C.outline + '77'} />
              <Text style={s.emptyTxt}>{t('no_expenses_yet')}</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const getStyles = (C: Theme) => {
  const glass = Platform.select({
    web: { boxShadow: `0 8px 32px ${C.glassShadow}`, backdropFilter: 'blur(20px)' },
    ios: { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)', },
    android: { elevation: 2 }
  });

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.surface },
    scroll: { flexGrow: 1, padding: 20, paddingBottom: 24 },
    pageTitleRow: { marginBottom: 18 },
    pageTitle: { fontSize: 22, fontWeight: '700', color: C.primary },
    pageSub: { fontSize: 12, color: C.outline, marginTop: 3 },
    summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.borderColor, borderLeftWidth: 3, padding: 10, gap: 3, ...glass },
    summaryLabel: { fontSize: 9, fontWeight: '600', color: C.outline, letterSpacing: 0.3 },
    summaryVal: { fontSize: 13, fontWeight: '700' },
    card: { backgroundColor: C.cardBg, borderRadius: 24, borderWidth: 1, borderColor: C.borderColor, padding: 18, marginBottom: 16, ...glass },
    cardTitle: { fontSize: 16, fontWeight: '700', color: C.primary },
    cardSub: { fontSize: 11, color: C.outline, marginBottom: 16 },
    chart: { flexDirection: 'row', height: 160, marginBottom: 10 },
    yAxis: { justifyContent: 'space-between', width: 34, paddingRight: 6 },
    yLabel: { fontSize: 9, color: C.outline, textAlign: 'right' },
    bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
    barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
    barVal: { fontSize: 8, color: C.outline, marginBottom: 4, fontWeight: '500' },
    barValActive: { color: C.secondary, fontWeight: '700' },
    barTrack: { width: '60%', flex: 1, justifyContent: 'flex-end', backgroundColor: C.surfaceContainer, borderRadius: 4, overflow: 'hidden', maxHeight: 120 },
    barFill: { width: '100%', backgroundColor: C.outlineVariant + '88', borderRadius: 4 },
    barFillActive: { backgroundColor: C.secondaryContainer },
    barLabel: { fontSize: 9, color: C.outline, marginTop: 5, fontWeight: '500' },
    barLabelActive: { color: C.primary, fontWeight: '700' },
    trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surfaceContainer, borderRadius: 10, padding: 8 },
    trendText: { fontSize: 11, fontWeight: '600', color: C.secondary, flex: 1 },
    breakdown: { gap: 14 },
    bdRow: { gap: 6 },
    bdMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bdDot: { width: 10, height: 10, borderRadius: 5 },
    bdName: { fontSize: 13, fontWeight: '600', color: C.onSurface, flex: 1 },
    bdAmt: { fontSize: 12, fontWeight: '700', color: C.primary },
    bdPct: { fontSize: 11, fontWeight: '700', minWidth: 30, textAlign: 'right' },
    bdBarBg: { height: 6, backgroundColor: C.surfaceContainer, borderRadius: 3, overflow: 'hidden' },
    bdBarFill: { height: '100%', borderRadius: 3 },
    emptyBox: { alignItems: 'center', paddingVertical: 20, gap: 8 },
    emptyTxt: { fontSize: 13, color: C.outline },
    searchRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 4 },
    searchInput: { flex: 1, backgroundColor: C.surfaceContainer, borderRadius: 12, borderWidth: 1, borderColor: C.outlineVariant + '55', paddingHorizontal: 12, fontSize: 14, color: C.primary, minHeight: 44 },
    searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.secondary, borderRadius: 12, paddingHorizontal: 16, minHeight: 44 },
    searchBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    priceHistTitle: { fontSize: 13, fontWeight: '700', color: C.primary, marginBottom: 12 },
    priceChart: { flexDirection: 'row', height: 130, alignItems: 'flex-end', gap: 10, marginVertical: 12, backgroundColor: C.surfaceContainerLow, borderRadius: 16, padding: 12 },
    priceBarCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
    priceBarVal: { fontSize: 8, color: C.outline, marginBottom: 4, fontWeight: '600' },
    priceBarTrack: { width: '50%', flex: 1, justifyContent: 'flex-end', backgroundColor: C.surfaceContainer, borderRadius: 4, overflow: 'hidden', maxHeight: 80 },
    priceBarFill: { width: '100%', backgroundColor: C.secondary, borderRadius: 4 },
    priceBarLabel: { fontSize: 9, color: C.outline, marginTop: 5, fontWeight: '600' },
    priceStats: { flexDirection: 'row', gap: 10, marginTop: 8 },
    priceStatBox: { flex: 1, backgroundColor: C.surfaceContainer, borderRadius: 12, padding: 10, alignItems: 'center' },
    priceStatLabel: { fontSize: 9, fontWeight: '700', color: C.outline, textTransform: 'uppercase' },
    priceStatVal: { fontSize: 14, fontWeight: '800', color: C.primary, marginTop: 2 },
    priceEmptyBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.surfaceContainerLow, borderRadius: 12, padding: 16, marginTop: 8 },
    priceEmptyText: { fontSize: 13, color: C.outline }
  });
};
