import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { authStyles } from './src/theme/authStyles';
import { loadSession, saveSession } from './src/services/sessionService';

export default function App() {
  const [screen, setScreen] = useState('login');

  useEffect(() => {
    const bootstrap = async () => {
      const session = await loadSession();

      if (session?.token) {
        setScreen('home');
      }
    };

    bootstrap();
  }, []);

  const handleAuthSuccess = async ({ token, user }) => {
    await saveSession({ token, user });
    setScreen('home');
  };

  if (screen === 'home') {
    return <HomeScreen />;
  }

  return (
    <LinearGradient colors={['#9968f7', '#58b3ff']} style={authStyles.gradientBackground}>
      <StatusBar style="light" />
      <SafeAreaView style={authStyles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}
          style={authStyles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={authStyles.keyboardScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {screen === 'login' ? (
              <LoginScreen
                onGoRegister={() => setScreen('register')}
                onAuthSuccess={handleAuthSuccess}
              />
            ) : (
              <RegisterScreen onGoLogin={() => setScreen('login')} />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
