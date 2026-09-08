import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, Alert
} from 'react-native';
import { AppContext, Theme } from '../context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CalculatorModal from '../components/CalculatorModal';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const getCategories = (C: Theme) => [
  { id: 'Groceries', en: 'Groceries', hi: 'किराना', icon: 'cart-outline', color: C.secondary },
  { id: 'Utilities', en: 'Utilities', hi: 'बिजली-पानी', icon: 'flash-outline', color: C.tertiary },
  { id: 'Dining', en: 'Dining', hi: 'बाहर खाना', icon: 'silverware-fork-knife', color: C.error },
  { id: 'Travel', en: 'Travel', hi: 'यात्रा', icon: 'car-outline', color: C.primary },
  { id: 'Rent', en: 'Rent', hi: 'किराया', icon: 'home-outline', color: '#3b82f6' },
  { id: 'Others', en: 'Others', hi: 'अन्य', icon: 'dots-horizontal-circle-outline', color: C.outline },
];

export default function ExpensesScreen() {
  const context = useContext(AppContext);
  if (!context) return null;

  const { addExpense, bulkSaveExpenses, voiceParseExpense, user, t, C, prefilledAmount, setPrefilledAmount } = context;
  const lang = user?.preferredLanguage || 'en';
  const isDark = C.surface !== '#fbf9fa';

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [type, setType] = useState<'debit' | 'credit'>('debit');
  const [errors, setErrors] = useState<{ title?: string | null; amount?: string | null }>({});
  const [success, setSuccess] = useState(false);

  const [showCalc, setShowCalc] = useState(false);
  const amountInputRef = useRef<TextInput>(null);

  // OCR Bill & Handwritten Diary Scanner states and handlers
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showDiaryReviewModal, setShowDiaryReviewModal] = useState(false);
  const [reviewedExpenses, setReviewedExpenses] = useState<Array<{ amount: number; itemName: string; category: string; date: string; rawDate?: string }>>([]);
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  const handleLaunchCamera = async (targetMode: 'bill' | 'diary' = 'bill') => {
    setShowScanOptions(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          lang === 'hi' ? 'अनुमति आवश्यक' : 'Permission Required',
          lang === 'hi' ? 'कैमरा का उपयोग करने के लिए अनुमति की आवश्यकता है।' : 'Camera permission is required to scan.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaType?.Images || ImagePicker.MediaTypeOptions?.Images || ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (targetMode === 'diary') {
          uploadDiaryImage(result.assets[0].uri);
        } else {
          uploadBillImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(t('error'), String(error));
    }
  };

  const handleLaunchLibrary = async (targetMode: 'bill' | 'diary' = 'bill') => {
    setShowScanOptions(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          lang === 'hi' ? 'अनुमति आवश्यक' : 'Permission Required',
          lang === 'hi' ? 'गैलरी का उपयोग करने के लिए अनुमति की आवश्यकता है।' : 'Gallery permission is required to select images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType?.Images || ImagePicker.MediaTypeOptions?.Images || ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (targetMode === 'diary') {
          uploadDiaryImage(result.assets[0].uri);
        } else {
          uploadBillImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert(t('error'), String(error));
    }
  };

  const uploadBillImage = async (uri: string) => {
    setIsScanning(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'bill.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : `image/jpeg`;

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: blob.type || fileType });
        formData.append('bill', file);
      } else {
        formData.append('bill', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: filename,
          type: fileType,
        } as any);
      }

      const res = await axios.post('/api/expenses/scan-bill', formData);

      setIsScanning(false);

      if (res.data.success) {
        const { extractedAmount, extractedMerchant, suggestedCategory } = res.data;
        setAmount(String(extractedAmount || ''));
        setTitle(extractedMerchant || '');
        if (suggestedCategory) {
          setCategory(suggestedCategory);
        }
        setErrors(e => ({ ...e, amount: null, title: null }));
        
        Alert.alert(
          lang === 'hi' ? 'सफलता' : 'Success',
          lang === 'hi' 
            ? `बिल स्कैन सफल! ₹${extractedAmount} राशि और '${extractedMerchant}' वस्तु नाम दर्ज किया गया।` 
            : `Bill scanned successfully! Extracted ₹${extractedAmount} from '${extractedMerchant}'.`
        );
      } else {
        throw new Error('OCR API failed to parse image');
      }
    } catch (error: any) {
      setIsScanning(false);
      console.error('OCR Upload error:', error);
      Alert.alert(
        lang === 'hi' ? 'स्कैनिंग विफल' : 'Scanning Failed',
        lang === 'hi' 
          ? 'रसीद को स्कैन करने में त्रुटि हुई। कृपया मैन्युअल रूप से विवरण भरें।' 
          : 'Could not process receipt image. Please enter details manually.'
      );
    }
  };

  const uploadDiaryImage = async (uri: string) => {
    setIsScanning(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'diary.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : `image/jpeg`;

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: blob.type || fileType });
        formData.append('diary', file);
      } else {
        formData.append('diary', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: filename,
          type: fileType,
        } as any);
      }

      const res = await axios.post('/api/expenses/scan-diary', formData);
      setIsScanning(false);

      const extractedList = res.data.data || res.data.expenses || [];
      if (res.data.success && Array.isArray(extractedList) && extractedList.length > 0) {
        setReviewedExpenses(extractedList);
        setShowDiaryReviewModal(true);
      } else {
        throw new Error('No items detected in diary image');
      }
    } catch (error: any) {
      setIsScanning(false);
      console.error('Diary Scan error:', error);
      Alert.alert(
        lang === 'hi' ? 'डायरी स्कैनिंग विफल' : 'Diary Scanning Failed',
        lang === 'hi'
          ? 'डायरी को स्कैन करने में त्रुटि हुई। कृपया दोबारा प्रयास करें।'
          : 'Could not process handwritten diary image. Please try again.'
      );
    }
  };

  const handleBulkSave = async () => {
    if (reviewedExpenses.length === 0) return;
    setIsSavingBulk(true);
    const successResult = await bulkSaveExpenses(reviewedExpenses);
    setIsSavingBulk(false);
    if (successResult) {
      setShowDiaryReviewModal(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      Alert.alert(
        lang === 'hi' ? 'सफलता' : 'Success',
        lang === 'hi'
          ? `${reviewedExpenses.length} खर्चे सफलतापूर्वक सेव किए गए और +${reviewedExpenses.length * 10} पॉइंट्स मिले!`
          : `Saved ${reviewedExpenses.length} expenses successfully! +${reviewedExpenses.length * 10} reward points earned!`
      );
      setReviewedExpenses([]);
    }
  };

  // Auto-populate when amount is calculated from the Dashboard Calculator
  useEffect(() => {
    if (prefilledAmount) {
      setAmount(prefilledAmount);
      setErrors(e => ({ ...e, amount: null }));
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 150);
      setPrefilledAmount(''); // consume the prefill
    }
  }, [prefilledAmount, setPrefilledAmount]);

  // Voice Recognition Simulation Modal states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [isVoiceParsing, setIsVoiceParsing] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!title.trim()) e.title = t('name_required');
    const amtNum = parseFloat(amount);
    if (!amount || isNaN(amtNum) || amtNum <= 0) {
      e.amount = t('amount_required');
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleAdd = async () => {
    if (validate()) {
      await addExpense(title.trim(), amount, category, type);
      setSuccess(true);
      setTitle('');
      setAmount('');
      setCategory('Groceries');
      setTimeout(() => setSuccess(false), 2500);
    }
  };

  const handleParse = async () => {
    if (!voiceText.trim()) return;
    setIsVoiceParsing(true);
    const result = await voiceParseExpense(voiceText.trim());
    setIsVoiceParsing(false);
    if (result) {
      setTitle(result.itemName);
      setAmount(String(result.amount));
      setCategory(result.category);
      setType('debit');
      setShowVoiceModal(false);
      setVoiceText('');
    }
  };

  const voicePresets = [
    { text: "Sabzi 150", label: "Sabzi 150" },
    { text: "Doodh wale ko 1200", label: "Doodh 1200" },
    { text: "Bijli ka bill 2500", label: "Bijli 2500" },
    { text: "Rickshaw fare 80", label: "Rickshaw 80" }
  ];

  const s = getStyles(C);
  const activeCategories = getCategories(C);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={s.titleRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={s.pageTitle}>{t('log_expense')}</Text>
            <Text style={s.pageSub}>{t('log_expense_subtitle')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity style={s.scanBtnHeader} onPress={() => setShowScanOptions(true)} activeOpacity={0.8}>
              <MaterialCommunityIcons name="camera" size={18} color={isDark ? '#000' : '#fff'} />
              <Text style={s.scanBtnTextHeader}>{lang === 'hi' ? 'बिल स्कैन' : 'Scan Bill'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={s.micBtnFloating} onPress={() => setShowVoiceModal(true)} activeOpacity={0.8}>
              <MaterialCommunityIcons name="microphone" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {success && (
          <View style={s.successBox}>
            <MaterialCommunityIcons name="check-circle-outline" size={18} color="#002115" />
            <Text style={s.successText}>{t('expense_added')}</Text>
          </View>
        )}

        {/* Card Form */}
        <View style={s.card}>
          
          {/* Credit / Debit Tab Switcher */}
          <Text style={s.label}>{t('transaction_type')}</Text>
          <View style={s.typeRow}>
            <TouchableOpacity 
              style={[
                s.typeBtn, 
                type === 'debit' && { borderColor: C.error, backgroundColor: isDark ? 'rgba(248,113,113,0.1)' : 'rgba(186,26,26,0.06)' }
              ]} 
              onPress={() => setType('debit')}
            >
              <MaterialCommunityIcons name="arrow-down-bold-circle-outline" size={18} color={C.error} />
              <View>
                <Text style={[s.typeBtnText, type === 'debit' && { color: C.error }]}>{t('debit_label')}</Text>
                <Text style={s.typeBtnSub}>{t('debit_sub')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                s.typeBtn, 
                type === 'credit' && { borderColor: C.secondary, backgroundColor: isDark ? 'rgba(130,179,158,0.15)' : 'rgba(65,102,86,0.06)' }
              ]} 
              onPress={() => setType('credit')}
            >
              <MaterialCommunityIcons name="arrow-up-bold-circle-outline" size={18} color={C.secondary} />
              <View>
                <Text style={[s.typeBtnText, type === 'credit' && { color: C.secondary }]}>{t('credit_label')}</Text>
                <Text style={s.typeBtnSub}>{t('credit_sub')}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Item Name */}
          <View style={s.field}>
            <Text style={s.label}>{t('item_name')}</Text>
            <View style={[s.inputRow, errors.title && s.inputErr]}>
              <TextInput
                style={s.input}
                placeholder={t('item_name_placeholder')}
                placeholderTextColor={C.outline + '88'}
                value={title}
                onChangeText={tVal => { setTitle(tVal); setErrors(e => ({ ...e, title: null })); }}
              />
            </View>
            {errors.title && <Text style={s.err}>{errors.title}</Text>}
          </View>

          {/* Amount */}
          <View style={s.field}>
            <Text style={s.label}>{t('amount_label')}</Text>
            <View style={[s.inputRow, errors.amount && s.inputErr]}>
              <Text style={s.rupee}>₹</Text>
              <TextInput
                ref={amountInputRef}
                style={s.input}
                placeholder="0.00"
                placeholderTextColor={C.outline + '88'}
                keyboardType="numeric"
                value={amount}
                onChangeText={tVal => { setAmount(tVal.replace(/[^0-9.]/g, '')); setErrors(e => ({ ...e, amount: null })); }}
              />
              <TouchableOpacity 
                style={s.calcBtnInline} 
                onPress={() => setShowCalc(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="calculator" size={20} color={C.secondary} />
              </TouchableOpacity>
            </View>
            {errors.amount && <Text style={s.err}>{errors.amount}</Text>}
          </View>

          <CalculatorModal
            visible={showCalc}
            onClose={() => setShowCalc(false)}
            onAddValue={val => {
              setAmount(val);
              setErrors(e => ({ ...e, amount: null }));
              setTimeout(() => {
                amountInputRef.current?.focus();
              }, 150);
            }}
          />

          {/* Category selection grid */}
          <View style={s.field}>
            <Text style={s.label}>{t('categories_title')}</Text>
            <View style={s.grid}>
              {activeCategories.map(cat => {
                const selected = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      s.gridBtn,
                      selected && { borderColor: cat.color, backgroundColor: isDark ? cat.color + '18' : cat.color + '0e' }
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <View style={[s.gridIcon, { backgroundColor: isDark ? cat.color + '22' : cat.color + '15' }]}>
                      <MaterialCommunityIcons name={cat.icon as any} size={18} color={cat.color} />
                    </View>
                    <Text style={[s.gridLabel, selected && { color: cat.color, fontWeight: '700' }]}>
                      {t('cat_' + cat.id.toLowerCase())}
                    </Text>
                    {selected && (
                      <MaterialCommunityIcons name="check-circle" size={14} color={cat.color} style={s.gridCheck} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Preview Banner */}
          {!!(title.trim() && amount && !isNaN(parseFloat(amount))) && (
            <View style={s.preview}>
              <MaterialCommunityIcons name="information" size={16} color={C.secondary} />
              <Text style={s.previewText}>
                {t('preview_log_tx', { amount: parseFloat(amount), title })}
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity style={s.submitBtn} onPress={handleAdd} activeOpacity={0.85}>
            <Text style={s.submitText}>{t('btn_add_expense')}</Text>
            <Text style={s.submitSub}>{t('btn_add_expense_sub')}</Text>
          </TouchableOpacity>
        </View>

      {/* AI Voice Recognition Simulation Modal */}
      <Modal animationType="fade" transparent={true} visible={showVoiceModal} onRequestClose={() => setShowVoiceModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: C.surfaceContainer }]}>
            <View style={s.modalHeader}>
              <MaterialCommunityIcons name="microphone" size={24} color={C.secondary} />
              <Text style={s.modalTitle}>{t('voice_modal_title')}</Text>
            </View>
            <Text style={s.modalSubtitle}>{t('voice_modal_sub')}</Text>

            {/* Presets */}
            <View style={s.presetsGrid}>
              {voicePresets.map((preset, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={s.presetChip} 
                  onPress={() => setVoiceText(preset.text)}
                >
                  <Text style={s.presetChipText}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Simulated TextInput */}
            <View style={s.simulationField}>
              <TextInput
                style={s.simInput}
                placeholder={t('voice_placeholder')}
                placeholderTextColor={C.outline + '88'}
                value={voiceText}
                onChangeText={setVoiceText}
              />
            </View>

            {/* Action buttons */}
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowVoiceModal(false); setVoiceText(''); }}>
                <Text style={s.cancelBtnText}>{t('btn_cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.parseBtn} onPress={handleParse} disabled={isVoiceParsing || !voiceText.trim()}>
                {isVoiceParsing ? (
                  <ActivityIndicator size="small" color={isDark ? '#000' : '#fff'} />
                ) : (
                  <Text style={[s.parseBtnText, { color: isDark ? '#000' : '#fff' }]}>{t('btn_parse')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Multi-Item Review Modal for Handwritten Diary Scanning */}
      <Modal animationType="slide" transparent={true} visible={showDiaryReviewModal} onRequestClose={() => setShowDiaryReviewModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.reviewModalContent, { backgroundColor: C.surfaceContainer }]}>
            <View style={s.modalHeader}>
              <MaterialCommunityIcons name="notebook-edit-outline" size={24} color={C.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={s.modalTitle}>
                  {lang === 'hi' ? 'स्कैन किए खर्चे चेक करें' : 'Review Scanned Entries'}
                </Text>
                <Text style={s.modalSubtitle}>
                  {lang === 'hi'
                    ? `${reviewedExpenses.length} खर्चे पहचाने गए। सेव करने से पहले बदलें या डिलीट करें।`
                    : `Extracted ${reviewedExpenses.length} items. Edit or remove before saving.`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDiaryReviewModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color={C.outline} />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.reviewList} showsVerticalScrollIndicator={true}>
              {reviewedExpenses.map((item, idx) => (
                <View key={idx} style={[s.reviewCard, { backgroundColor: C.cardBg }]}>
                  <View style={s.reviewCardRow}>
                    {/* Item Name */}
                    <View style={{ flex: 2, marginRight: 8 }}>
                      <Text style={s.smallLabel}>{lang === 'hi' ? 'सामग्री का नाम' : 'Item Name'}</Text>
                      <TextInput
                        style={s.reviewInput}
                        value={item.itemName}
                        onChangeText={text => {
                          const updated = [...reviewedExpenses];
                          updated[idx].itemName = text;
                          setReviewedExpenses(updated);
                        }}
                      />
                    </View>

                    {/* Amount */}
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={s.smallLabel}>{lang === 'hi' ? 'राशि (₹)' : 'Amount (₹)'}</Text>
                      <TextInput
                        style={s.reviewInput}
                        keyboardType="numeric"
                        value={String(item.amount)}
                        onChangeText={text => {
                          const updated = [...reviewedExpenses];
                          updated[idx].amount = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
                          setReviewedExpenses(updated);
                        }}
                      />
                    </View>

                    {/* Delete button */}
                    <TouchableOpacity
                      style={s.deleteRowBtn}
                      onPress={() => {
                        setReviewedExpenses(prev => prev.filter((_, i) => i !== idx));
                      }}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color={C.error} />
                    </TouchableOpacity>
                  </View>

                  <View style={s.reviewCardRowMeta}>
                    {/* Category Selector */}
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={s.smallLabel}>{lang === 'hi' ? 'श्रेणी' : 'Category'}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catPillScroll}>
                        {activeCategories.map(cat => {
                          const isSel = item.category === cat.id;
                          return (
                            <TouchableOpacity
                              key={cat.id}
                              style={[
                                s.catPill,
                                isSel && { backgroundColor: cat.color + '33', borderColor: cat.color }
                              ]}
                              onPress={() => {
                                const updated = [...reviewedExpenses];
                                updated[idx].category = cat.id;
                                setReviewedExpenses(updated);
                              }}
                            >
                              <Text style={[s.catPillText, isSel && { color: cat.color, fontWeight: '700' }]}>
                                {t('cat_' + cat.id.toLowerCase())}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>

                    {/* Date */}
                    <View style={{ width: 105 }}>
                      <Text style={s.smallLabel}>{lang === 'hi' ? 'तारीख' : 'Date'}</Text>
                      <TextInput
                        style={s.reviewInputSmall}
                        value={item.date}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={C.outline + '77'}
                        onChangeText={text => {
                          const updated = [...reviewedExpenses];
                          updated[idx].date = text;
                          setReviewedExpenses(updated);
                        }}
                      />
                    </View>
                  </View>
                </View>
              ))}

              {/* Add New Row Button */}
              <TouchableOpacity
                style={s.addRowBtn}
                onPress={() => {
                  setReviewedExpenses(prev => [
                    ...prev,
                    {
                      itemName: lang === 'hi' ? 'नया खर्चा' : 'New Item',
                      amount: 0,
                      category: 'Groceries',
                      date: new Date().toISOString().split('T')[0]
                    }
                  ]);
                }}
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={18} color={C.secondary} />
                <Text style={s.addRowText}>{lang === 'hi' ? '+ नया खर्चा जोड़ें' : '+ Add New Item'}</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Total and Bulk Save Action */}
            <View style={s.bulkSaveFooter}>
              <View style={s.bulkTotalBox}>
                <Text style={s.bulkTotalLabel}>{lang === 'hi' ? 'कुल राशि' : 'Total Spent'}:</Text>
                <Text style={s.bulkTotalValue}>
                  ₹{reviewedExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)}
                </Text>
              </View>

              <TouchableOpacity
                style={[s.bulkSaveBtn, (isSavingBulk || reviewedExpenses.length === 0) && { opacity: 0.6 }]}
                disabled={isSavingBulk || reviewedExpenses.length === 0}
                onPress={handleBulkSave}
              >
                {isSavingBulk ? (
                  <ActivityIndicator size="small" color={isDark ? '#000' : '#fff'} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save-all" size={20} color={isDark ? '#000' : '#fff'} />
                    <Text style={s.bulkSaveBtnText}>
                      {lang === 'hi' ? 'सभी खर्चे सेव करें' : 'Save All to Expenses'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* OCR Scan Loading Overlay */}
      <Modal animationType="fade" transparent={true} visible={isScanning} onRequestClose={() => {}}>
        <View style={s.scannerOverlay}>
          <View style={[s.scannerLoadingCard, { backgroundColor: C.surfaceContainer }]}>
            <ActivityIndicator size="large" color={C.secondary} />
            <Text style={s.scannerLoadingText}>
              {"Scanning your document with AI...\nएआई द्वारा पर्ची / डायरी स्कैन हो रही है..."}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Scan Options Bottom Sheet / Dialog */}
      <Modal animationType="slide" transparent={true} visible={showScanOptions} onRequestClose={() => setShowScanOptions(false)}>
        <View style={s.bottomSheetOverlay}>
          <View style={[s.bottomSheetContent, { backgroundColor: C.surfaceContainer }]}>
            <View style={s.bottomSheetHeader}>
              <Text style={s.bottomSheetTitle}>
                {lang === 'hi' ? 'स्कैन प्रकार चुनें' : 'Select Scan Mode'}
              </Text>
            </View>
            
            {/* Section 1: Printed Bill */}
            <Text style={s.sheetSubSectionLabel}>{lang === 'hi' ? '📄 प्रिंटेड बिल / रसीद' : '📄 Printed Bill / Receipt'}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[s.bottomSheetBtn, { flex: 1 }]} onPress={() => handleLaunchCamera('bill')} activeOpacity={0.75}>
                <MaterialCommunityIcons name="camera-outline" size={20} color={C.secondary} />
                <Text style={s.bottomSheetBtnText}>{lang === 'hi' ? 'कैमरा' : 'Camera'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.bottomSheetBtn, { flex: 1 }]} onPress={() => handleLaunchLibrary('bill')} activeOpacity={0.75}>
                <MaterialCommunityIcons name="image-outline" size={20} color={C.secondary} />
                <Text style={s.bottomSheetBtnText}>{lang === 'hi' ? 'गैलरी' : 'Gallery'}</Text>
              </TouchableOpacity>
            </View>

            {/* Section 2: Handwritten Diary */}
            <Text style={s.sheetSubSectionLabel}>{lang === 'hi' ? '📝 हाथ से लिखी डायरी / पर्ची' : '📝 Handwritten Diary / Note'}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[s.bottomSheetBtn, { flex: 1, borderColor: C.secondary + '66' }]} onPress={() => handleLaunchCamera('diary')} activeOpacity={0.75}>
                <MaterialCommunityIcons name="notebook-outline" size={20} color={C.secondary} />
                <Text style={s.bottomSheetBtnText}>{lang === 'hi' ? 'डायरी कैमरा' : 'Diary Camera'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.bottomSheetBtn, { flex: 1, borderColor: C.secondary + '66' }]} onPress={() => handleLaunchLibrary('diary')} activeOpacity={0.75}>
                <MaterialCommunityIcons name="notebook-edit-outline" size={20} color={C.secondary} />
                <Text style={s.bottomSheetBtnText}>{lang === 'hi' ? 'डायरी गैलरी' : 'Diary Gallery'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[s.bottomSheetBtn, s.cancelSheetBtn]} onPress={() => setShowScanOptions(false)} activeOpacity={0.75}>
              <Text style={s.cancelSheetBtnText}>
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const getStyles = (C: Theme) => {
  const glass = Platform.select({
    web: { boxShadow: `0 8px 32px ${C.glassShadow}`, backdropFilter: 'blur(20px)' },
    ios: { shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 14 },
    android: { elevation: 2 }
  });
  const isDark = C.surface !== '#fbf9fa';

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.surface },
    scroll: { flexGrow: 1, padding: 20, paddingBottom: 24 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    pageTitle: { fontSize: 22, fontWeight: '700', color: C.primary },
    pageSub: { fontSize: 12, color: C.outline, marginTop: 3 },
    micBtnFloating: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.secondary, alignItems: 'center', justifyContent: 'center', shadowColor: C.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
    scanBtnHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, paddingHorizontal: 12, height: 46, borderRadius: 23, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
    scanBtnTextHeader: { color: isDark ? '#000' : '#fff', fontSize: 13, fontWeight: '700' },
    scannerOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    scannerLoadingCard: { borderRadius: 20, padding: 30, alignItems: 'center', gap: 16, borderWidth: 1, borderColor: C.borderColor, width: '80%', maxWidth: 320, ...glass },
    scannerLoadingText: { fontSize: 14, fontWeight: '600', color: C.primary, textAlign: 'center', lineHeight: 20 },
    bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    bottomSheetContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 10, borderWidth: 1, borderColor: C.borderColor, ...glass },
    bottomSheetHeader: { alignItems: 'center', marginBottom: 6 },
    bottomSheetTitle: { fontSize: 16, fontWeight: '700', color: C.primary },
    sheetSubSectionLabel: { fontSize: 11, fontWeight: '700', color: C.onSurfaceVariant, marginTop: 6 },
    bottomSheetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.cardBg, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: C.borderColor },
    bottomSheetBtnText: { fontSize: 13, fontWeight: '600', color: C.primary },
    cancelSheetBtn: { backgroundColor: 'transparent', borderColor: 'transparent', justifyContent: 'center', marginTop: 4 },
    cancelSheetBtnText: { fontSize: 14, fontWeight: '700', color: C.error },
    successBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#c3ecd7', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(65,102,86,0.2)', padding: 12, marginBottom: 16 },
    successText: { fontSize: 13, fontWeight: '600', color: '#002115', flex: 1 },
    card: { backgroundColor: C.cardBg, borderRadius: 24, borderWidth: 1, borderColor: C.borderColor, padding: 18, ...glass },
    label: { fontSize: 10, fontWeight: '700', color: C.onSurfaceVariant, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
    typeRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1.5, borderColor: C.outlineVariant + '55', backgroundColor: C.surfaceContainer, paddingVertical: 12, paddingHorizontal: 12 },
    typeBtnText: { fontSize: 13, fontWeight: '700', color: C.onSurfaceVariant },
    typeBtnSub: { fontSize: 10, color: C.outline, marginTop: 1 },
    field: { marginBottom: 16 },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceContainer, borderRadius: 14, borderWidth: 1, borderColor: C.outlineVariant + '55', paddingHorizontal: 14, minHeight: 50 },
    inputErr: { borderColor: C.error },
    rupee: { fontSize: 18, fontWeight: '700', color: C.primary, marginRight: 8 },
    input: { flex: 1, fontSize: 15, color: C.primary, paddingVertical: 12 },
    calcBtnInline: {
      padding: 6,
      marginLeft: 4,
      borderRadius: 10,
      backgroundColor: C.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.borderColor
    },
    err: { fontSize: 11, color: C.error, marginTop: 5, marginLeft: 2 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    gridBtn: { width: '31%', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, borderColor: C.outlineVariant + '55', backgroundColor: C.surfaceContainer, paddingVertical: 12, paddingHorizontal: 4, position: 'relative' },
    gridIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    gridLabel: { fontSize: 10, fontWeight: '600', color: C.onSurfaceVariant, textAlign: 'center' },
    gridCheck: { position: 'absolute', top: 4, right: 4 },
    preview: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surfaceContainer, borderRadius: 12, padding: 12, marginBottom: 10 },
    previewText: { fontSize: 12, fontWeight: '600', color: C.onSurface, flex: 1 },
    submitBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 },
    submitText: { fontSize: 15, fontWeight: '700', color: isDark ? '#000' : '#fff' },
    submitSub: { fontSize: 10, color: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', marginTop: 2 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
    modalContent: { borderRadius: 24, padding: 20, width: '100%', maxWidth: 400, gap: 14, borderWidth: 1, borderColor: C.borderColor, ...glass },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: C.primary },
    modalSubtitle: { fontSize: 12, color: C.onSurfaceVariant, marginTop: 2 },
    presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
    presetChip: { backgroundColor: C.surfaceContainer, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.outlineVariant + '44' },
    presetChipText: { fontSize: 12, fontWeight: '600', color: C.primary },
    simulationField: { backgroundColor: C.surfaceContainer, borderRadius: 14, borderWidth: 1, borderColor: C.outlineVariant + '55', paddingHorizontal: 14 },
    simInput: { fontSize: 14, color: C.primary, paddingVertical: 12 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
    cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
    cancelBtnText: { fontSize: 14, fontWeight: '600', color: C.onSurfaceVariant },
    parseBtn: { backgroundColor: C.secondary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center', minWidth: 80 },
    parseBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

    // Review Modal Styles
    reviewModalContent: { borderRadius: 24, padding: 20, width: '100%', maxWidth: 520, maxHeight: '88%', gap: 12, borderWidth: 1, borderColor: C.borderColor, ...glass },
    reviewList: { maxHeight: 380, marginVertical: 4 },
    reviewCard: { borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.borderColor, gap: 6 },
    reviewCardRow: { flexDirection: 'row', alignItems: 'center' },
    reviewCardRowMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    smallLabel: { fontSize: 10, fontWeight: '700', color: C.onSurfaceVariant, marginBottom: 4 },
    reviewInput: { backgroundColor: C.surfaceContainer, borderRadius: 10, borderWidth: 1, borderColor: C.outlineVariant + '55', paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: C.primary },
    reviewInputSmall: { backgroundColor: C.surfaceContainer, borderRadius: 10, borderWidth: 1, borderColor: C.outlineVariant + '55', paddingHorizontal: 8, paddingVertical: 6, fontSize: 11, color: C.primary },
    deleteRowBtn: { padding: 8, borderRadius: 10, backgroundColor: C.surfaceContainer, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
    catPillScroll: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    catPill: { borderRadius: 12, borderWidth: 1, borderColor: C.outlineVariant + '44', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: C.surfaceContainer },
    catPillText: { fontSize: 10, color: C.onSurfaceVariant },
    addRowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: C.secondary, marginVertical: 6 },
    addRowText: { fontSize: 13, fontWeight: '600', color: C.secondary },
    bulkSaveFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.borderColor },
    bulkTotalBox: { flexDirection: 'column' },
    bulkTotalLabel: { fontSize: 11, color: C.outline },
    bulkTotalValue: { fontSize: 18, fontWeight: '800', color: C.primary },
    bulkSaveBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18 },
    bulkSaveBtnText: { fontSize: 14, fontWeight: '700', color: isDark ? '#000' : '#fff' }
  });
};
