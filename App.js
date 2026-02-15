import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { authStyles } from './src/theme/authStyles';
import { clearSession, loadSession, saveSession } from './src/services/sessionService';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [sessionExpiredVisible, setSessionExpiredVisible] = useState(false);

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

  const handleLogout = async () => {
    await clearSession();
    setScreen('login');
  };

  const handleSessionExpired = async () => {
    await clearSession();
    setScreen('login');
    setSessionExpiredVisible(true);
  };

  if (screen === 'home') {
    return <HomeScreen onLogout={handleLogout} onSessionExpired={handleSessionExpired} />;
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

      <Modal
        animationType="fade"
        transparent
        visible={sessionExpiredVisible}
        onRequestClose={() => setSessionExpiredVisible(false)}
      >
        <View style={authStyles.modalBackdrop}>
          <View style={authStyles.modalCard}>
            <Text style={authStyles.modalTitle}>Sesión expirada</Text>
            <Text style={authStyles.modalMessage}>Tu sesión expiró. Inicia sesión nuevamente.</Text>

            <Pressable
              style={[authStyles.modalButton, authStyles.modalButtonPrimary, { alignSelf: 'flex-end' }]}
              onPress={() => setSessionExpiredVisible(false)}
            >
              <Text style={authStyles.modalButtonTextPrimary}>Aceptar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}
