import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Platform
} from 'react-native';

const MUSTARD = '#F4D144';
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const ANTHRACITE = '#222222';

// Solid shadow styles for Neo-brutalism
const solidBoxShadow = {
  backgroundColor: MUSTARD,
  borderWidth: 4,
  borderColor: BLACK,
  // iOS
  shadowColor: BLACK,
  shadowOffset: { width: 6, height: 6 },
  shadowOpacity: 1,
  shadowRadius: 0,
  // Android doesn't support solid shadows via elevation well, so we rely on borders
  elevation: 0,
};

const solidTextShadow = {
  textShadowColor: WHITE,
  textShadowOffset: { width: 3, height: 3 },
  textShadowRadius: 0,
};

const BrutalistButton = ({ onPress, children, style, disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default function App() {
  const [mode, setMode] = useState('kuruşsuz'); // 'kuruşsuz' or '10lar'
  const [amount, setAmount] = useState('');
  const [peopleCount, setPeopleCount] = useState(null);
  const [otherCount, setOtherCount] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [results, setResults] = useState([]);
  const [paidCustomers, setPaidCustomers] = useState({});

  const amountShake = useRef(new Animated.Value(0)).current;
  const peopleShake = useRef(new Animated.Value(0)).current;

  const triggerShake = (animValue) => {
    Animated.sequence([
      Animated.timing(animValue, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(animValue, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(animValue, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(animValue, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleAmountChange = (val) => {
    // Sadece rakam (0-9) kalacak şekilde filtrele
    const strictNum = val.replace(/[^0-9]/g, '');
    setAmount(strictNum);
  };

  const handleOtherCountChange = (val) => {
    // Sadece rakam (0-9) kalacak şekilde filtrele
    const strictNum = val.replace(/[^0-9]/g, '');
    setOtherCount(strictNum);
  };

  const finalizeOtherInput = () => {
    setShowOtherInput(false);
    if (otherCount && parseInt(otherCount) > 0) {
      setPeopleCount(parseInt(otherCount));
    } else if (peopleCount === null || (peopleCount > 6 && !otherCount)) {
      // Eğer kişi sayısı geçerli değilse temizle
      setPeopleCount(null);
      setOtherCount('');
    }
  };

  const handleCalculate = () => {
    Keyboard.dismiss();
    const parsedAmount = parseFloat(amount);
    let isValid = true;

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      triggerShake(amountShake);
      isValid = false;
    }

    const finalPeople = showOtherInput && otherCount ? parseInt(otherCount) : peopleCount;
    
    if (!finalPeople || isNaN(finalPeople) || finalPeople < 1) {
      triggerShake(peopleShake);
      isValid = false;
    }

    if (!isValid) return;

    // Eğer input açıksa ve hesaplaya basıldıysa state'i eşitle
    if (showOtherInput) {
      setShowOtherInput(false);
      setPeopleCount(finalPeople);
    }

    let baseAmount = 0;
    let firstAmount = 0;

    if (mode === 'kuruşsuz') {
      baseAmount = Math.floor(parsedAmount / finalPeople);
      firstAmount = baseAmount + (parsedAmount - (baseAmount * finalPeople));
    } else {
      baseAmount = Math.floor(parsedAmount / finalPeople / 10) * 10;
      firstAmount = parsedAmount - (baseAmount * (finalPeople - 1));
    }

    const newResults = [];
    for (let i = 1; i <= finalPeople; i++) {
      newResults.push({
        id: i,
        title: `Müşteri ${i}`,
        amount: i === 1 ? firstAmount : baseAmount,
      });
    }

    setResults(newResults);
    setPaidCustomers({});
    setModalVisible(true);
  };

  const handlePay = (id) => {
    const newPaid = { ...paidCustomers, [id]: true };
    setPaidCustomers(newPaid);
    
    if (Object.keys(newPaid).length === results.length) {
      setTimeout(() => {
        setModalVisible(false);
        resetApp();
      }, 500);
    }
  };

  const resetApp = () => {
    setAmount('');
    setPeopleCount(null);
    setOtherCount('');
    setShowOtherInput(false);
  };

  // 2, 3, 4, 5, 6 dışında bir sayı girilmişse bu "Diğer" kategorisine girer
  const isCustomCount = peopleCount !== null && ![2, 3, 4, 5, 6].includes(peopleCount);

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = 'KüsürAT';
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
          
          {/* TOP BAR: Title & Mode Toggle */}
          <View style={styles.header}>
            <Text style={styles.appTitle}>KüsürAT</Text>
            
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleBtn, mode === 'kuruşsuz' && styles.toggleBtnActive]}
                onPress={() => setMode('kuruşsuz')}
              >
                <Text style={[styles.toggleText, mode === 'kuruşsuz' && styles.toggleTextActive]}>Kuruş</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, mode === '10lar' && styles.toggleBtnActive]}
                onPress={() => setMode('10lar')}
              >
                <Text style={[styles.toggleText, mode === '10lar' && styles.toggleTextActive]}>Onluk</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* MAIN AREA */}
          <View style={styles.mainContent}>
            <Text style={styles.sectionLabel}>HESAP TUTARI</Text>
            
            <Animated.View style={[styles.amountContainer, { transform: [{ translateX: amountShake }] }]}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#999"
                maxLength={8}
              />
              <Text style={styles.currencyText}>TL</Text>
            </Animated.View>

            <Text style={[styles.sectionLabel, { marginTop: 40 }]}>KİŞİ SAYISI</Text>
            
            <Animated.View style={[{ transform: [{ translateX: peopleShake }] }]}>
              <View style={styles.row}>
                {[2, 3, 4].map(num => (
                  <BrutalistButton 
                    key={num}
                    style={[styles.personBtn, peopleCount === num && !showOtherInput && styles.personBtnActive]}
                    onPress={() => { setPeopleCount(num); setOtherCount(''); setShowOtherInput(false); }}
                  >
                    <Text style={[styles.personBtnText, peopleCount === num && !showOtherInput && styles.personBtnTextActive]}>
                      {num}
                    </Text>
                  </BrutalistButton>
                ))}
              </View>
              <View style={styles.row}>
                {[5, 6].map(num => (
                  <BrutalistButton 
                    key={num}
                    style={[styles.personBtn, peopleCount === num && !showOtherInput && styles.personBtnActive]}
                    onPress={() => { setPeopleCount(num); setOtherCount(''); setShowOtherInput(false); }}
                  >
                    <Text style={[styles.personBtnText, peopleCount === num && !showOtherInput && styles.personBtnTextActive]}>
                      {num}
                    </Text>
                  </BrutalistButton>
                ))}
                
                {/* INLINE DIĞER BUTONU / INPUTU */}
                {showOtherInput ? (
                  <View style={[styles.personBtn, styles.personBtnActive, { paddingVertical: 0, justifyContent: 'center' }]}>
                    <TextInput
                      style={styles.inlineInput}
                      value={otherCount}
                      onChangeText={handleOtherCountChange}
                      onBlur={finalizeOtherInput}
                      onSubmitEditing={finalizeOtherInput}
                      keyboardType="number-pad"
                      placeholder="Sayı"
                      placeholderTextColor="#999"
                      autoFocus
                      maxLength={3}
                    />
                  </View>
                ) : (
                  <BrutalistButton 
                    style={[styles.personBtn, isCustomCount && styles.personBtnActive]}
                    onPress={() => {
                      setShowOtherInput(true);
                      if (isCustomCount) setOtherCount(peopleCount.toString());
                    }}
                  >
                    <Text style={[styles.personBtnText, isCustomCount && styles.personBtnTextActive]}>
                      {isCustomCount ? peopleCount : 'Diğer'}
                    </Text>
                  </BrutalistButton>
                )}
              </View>
            </Animated.View>
          </View>

          {/* BOTTOM BUTTON */}
          <View style={styles.footer}>
            <BrutalistButton style={styles.calcBtn} onPress={handleCalculate}>
              <Text style={styles.calcBtnText}>HESAPLA</Text>
            </BrutalistButton>
          </View>

          {/* RESULT MODAL */}
          <Modal visible={modalVisible} transparent={true} animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeBtnText}>X</Text>
                </TouchableOpacity>
                
                <Text style={styles.modalTitle}>HESAP BÖLÜNDÜ</Text>
                <Text style={styles.modalTotalText}>Toplam Hesap: {amount} TL</Text>
                
                <ScrollView style={styles.customerList} contentContainerStyle={{ paddingBottom: 20 }}>
                  {results.map(res => {
                    const isPaid = paidCustomers[res.id];
                    return (
                      <BrutalistButton 
                        key={res.id}
                        style={[styles.customerBtn, isPaid && styles.customerBtnPaid]}
                        onPress={() => handlePay(res.id)}
                        disabled={isPaid}
                      >
                        <Text style={[styles.customerBtnName, isPaid && styles.customerTextPaid]}>
                          {res.title}
                        </Text>
                        <Text style={[styles.customerBtnAmount, isPaid && styles.customerTextPaid]}>
                          {res.amount} TL
                        </Text>
                      </BrutalistButton>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MUSTARD,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: BLACK,
    ...solidTextShadow,
    letterSpacing: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderWidth: 3,
    borderColor: BLACK,
    backgroundColor: WHITE,
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: WHITE,
  },
  toggleBtnActive: {
    backgroundColor: BLACK,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '800',
    color: BLACK,
  },
  toggleTextActive: {
    color: WHITE,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: '900',
    color: BLACK,
    marginBottom: 10,
    letterSpacing: 1,
    ...solidTextShadow,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderWidth: 4,
    borderColor: BLACK,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: BLACK,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 72,
    fontWeight: '900',
    color: BLACK,
    height: 90,
  },
  currencyText: {
    fontSize: 40,
    fontWeight: '900',
    color: BLACK,
    marginLeft: 10,
    ...solidTextShadow,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  personBtn: {
    flex: 1,
    backgroundColor: WHITE,
    borderWidth: 4,
    borderColor: BLACK,
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: BLACK,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    minHeight: 70,
  },
  personBtnActive: {
    backgroundColor: BLACK,
    shadowOffset: { width: 0, height: 0 },
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  personBtnText: {
    fontSize: 24,
    fontWeight: '900',
    color: BLACK,
  },
  personBtnTextActive: {
    color: WHITE,
  },
  inlineInput: {
    fontSize: 24,
    fontWeight: '900',
    color: WHITE,
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  footer: {
    marginTop: 20,
    marginBottom: Platform.OS === 'ios' ? 10 : 30,
  },
  calcBtn: {
    backgroundColor: WHITE,
    borderWidth: 4,
    borderColor: BLACK,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: BLACK,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  calcBtnText: {
    fontSize: 32,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 2,
    ...solidTextShadow,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: MUSTARD,
    borderWidth: 5,
    borderColor: BLACK,
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
    shadowColor: BLACK,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    backgroundColor: WHITE,
    borderWidth: 3,
    borderColor: BLACK,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: BLACK,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  closeBtnText: {
    fontSize: 20,
    fontWeight: '900',
    color: BLACK,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: BLACK,
    marginBottom: 8,
    marginTop: 10,
    textAlign: 'center',
    ...solidTextShadow,
  },
  modalTotalText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  customerList: {
    width: '100%',
  },
  customerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderWidth: 4,
    borderColor: BLACK,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: BLACK,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  customerBtnPaid: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  customerBtnName: {
    fontSize: 20,
    fontWeight: '900',
    color: BLACK,
  },
  customerBtnAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: BLACK,
  },
  customerTextPaid: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
});
