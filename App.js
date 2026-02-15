import { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { authStyles } from './src/theme/authStyles';

export default function App() {
  const [screen, setScreen] = useState('login');

  return (
    <LinearGradient colors={['#9968f7', '#58b3ff']} style={authStyles.gradientBackground}>
      <StatusBar style="light" />
      <SafeAreaView style={authStyles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={authStyles.keyboardContainer}
        >
          {screen === 'login' ? (
            <LoginScreen onGoRegister={() => setScreen('register')} />
          ) : (
            <RegisterScreen onGoLogin={() => setScreen('login')} />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
