import React, { useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, View, ActivityIndicator } from 'react-native';
import { AppProvider, AppContext } from './src/context/AppContext';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import CalculatorScreen from './src/screens/CalculatorScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SpinWheelScreen from './src/screens/SpinWheelScreen';
import AppShell from './src/screens/AppShell';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();

function MainApp() {
  const context = useContext(AppContext);

  if (!context) {
    return null;
  }

  const { isLoggedIn, C, isDarkMode, loading } = context;
  const token = isLoggedIn ? 'valid-token' : null;

  // Render a clean loading indicator while initializing session
  if (loading) {
    return (
      <View style={styles.globalDesktopBackground}>
        <View style={[styles.globalMobileShell, { backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={C.secondary} />
        </View>
      </View>
    );
  }

  const navTheme = {
    dark: isDarkMode,
    colors: {
      primary: C.primary,
      background: C.surface,
      card: C.cardBg,
      text: C.primary,
      border: C.borderColor,
      notification: C.secondary,
    },
    fonts: DefaultTheme.fonts,
  };

  return (
    <View style={styles.globalDesktopBackground}>
      <View style={[styles.globalMobileShell, { backgroundColor: C.surface }]}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          <NavigationContainer theme={navTheme}>
            {token === null ? (
              // Stack 1: Auth Flow (Only accessible when logged out)
              <AuthStack.Navigator initialRouteName="Login">
                <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <AuthStack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
                <AuthStack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
              </AuthStack.Navigator>
            ) : (
              // Stack 2: App Flow (Only accessible when logged in)
              <AppStack.Navigator initialRouteName="Dashboard">
                <AppStack.Screen name="Dashboard" component={AppShell} options={{ headerShown: false }} />
                <AppStack.Screen name="Expenses" component={ExpensesScreen} options={{ headerShown: false }} />
                <AppStack.Screen name="Calculator" component={CalculatorScreen} options={{ headerShown: false }} />
                <AppStack.Screen name="Analytics" component={AnalyticsScreen} options={{ headerShown: false }} />
                <AppStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
                <AppStack.Screen name="Spin" component={SpinWheelScreen} options={{ headerShown: false }} />
              </AppStack.Navigator>
            )}
          </NavigationContainer>
        </SafeAreaView>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  globalDesktopBackground: {
    flex: 1,
    backgroundColor: '#1E1E24',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  globalMobileShell: {
    width: '100%',
    maxWidth: 430,
    height: '100%',
    maxHeight: 900,
    backgroundColor: '#F7F5F0',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 6,
    borderColor: '#2D2D34',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  }
});
