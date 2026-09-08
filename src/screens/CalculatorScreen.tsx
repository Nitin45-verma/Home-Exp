import React, { useContext } from 'react';
import { View } from 'react-native';
import { AppContext } from '../context/AppContext';
import CalculatorModal from '../components/CalculatorModal';

export default function CalculatorScreen({ navigation }: any) {
  const context = useContext(AppContext);
  if (!context) return null;

  const { setPrefilledAmount, C } = context;

  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <CalculatorModal
        visible={true}
        onClose={() => navigation.goBack()}
        onAddValue={(value) => {
          setPrefilledAmount(value);
          navigation.navigate('Expenses');
        }}
      />
    </View>
  );
}
