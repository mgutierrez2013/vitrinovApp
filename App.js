import 'react-native-gesture-handler';
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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TransactionsFilterScreen } from './src/screens/TransactionsFilterScreen';
import { EntrepreneursScreen } from './src/screens/EntrepreneursScreen';
import { EntrepreneurAccountScreen } from './src/screens/EntrepreneurAccountScreen';
import { BankAccountsScreen } from './src/screens/BankAccountsScreen';
import { BankAccountsClientScreen } from './src/screens/BankAccountsClientScreen';
import { NotificationReportScreen } from './src/screens/NotificationReportScreen';
import { TransactionReportScreen } from './src/screens/TransactionReportScreen';
import { authStyles } from './src/theme/authStyles';
import { clearSession, loadSession, saveSession } from './src/services/sessionService';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [sessionExpiredVisible, setSessionExpiredVisible] = useState(false);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState(null);
  const [selectedBankClient, setSelectedBankClient] = useState(null);

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
    setSelectedEntrepreneur(null);
    setSelectedBankClient(null);
    setScreen('login');
  };

  const handleSessionExpired = async () => {
    await clearSession();
    setSelectedEntrepreneur(null);
    setSelectedBankClient(null);
    setScreen('login');
    setSessionExpiredVisible(true);
  };

  if (screen === 'home') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <HomeScreen
          onLogout={handleLogout}
          onSessionExpired={handleSessionExpired}
          onGoAllTransactions={() => setScreen('transactions')}
          onGoEntrepreneurs={() => setScreen('entrepreneurs')}
          onGoBankAccounts={() => setScreen('bankAccounts')}
          onGoNotificationReports={() => setScreen('notificationReports')}
          onGoTransactionReports={() => setScreen('transactionReports')}
        />
      </GestureHandlerRootView>
    );
  }


  if (screen === 'entrepreneurs') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <EntrepreneursScreen
          onGoHome={() => setScreen('home')}
          onSessionExpired={handleSessionExpired}
          onLogout={handleLogout}
          onOpenAccount={(client) => {
            setSelectedEntrepreneur(client);
            setScreen('entrepreneurAccount');
          }}
          onGoBankAccounts={() => setScreen('bankAccounts')}
        />
      </GestureHandlerRootView>
    );
  }


  if (screen === 'entrepreneurAccount') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <EntrepreneurAccountScreen
          entrepreneur={selectedEntrepreneur}
          onGoHome={() => {
            setSelectedEntrepreneur(null);
            setScreen('entrepreneurs');
          }}
          onSessionExpired={handleSessionExpired}
        />
      </GestureHandlerRootView>
    );
  }


  if (screen === 'bankAccounts') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BankAccountsScreen
          onGoHome={() => setScreen('home')}
          onGoEntrepreneurs={() => setScreen('entrepreneurs')}
          onSessionExpired={handleSessionExpired}
          onLogout={handleLogout}
          onOpenClientAccounts={(client) => {
            setSelectedBankClient(client);
            setScreen('bankAccountsClient');
          }}
        />
      </GestureHandlerRootView>
    );
  }

  if (screen === 'bankAccountsClient') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BankAccountsClientScreen
          client={selectedBankClient}
          onGoBack={() => {
            setScreen('bankAccounts');
          }}
          onSessionExpired={handleSessionExpired}
          onLogout={handleLogout}
        />
      </GestureHandlerRootView>
    );
  }


  if (screen === 'notificationReports') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NotificationReportScreen
          onGoHome={() => setScreen('home')}
          onSessionExpired={handleSessionExpired}
          onLogout={handleLogout}
        />
      </GestureHandlerRootView>
    );
  }


  if (screen === 'transactionReports') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TransactionReportScreen
          onGoHome={() => setScreen('home')}
          onSessionExpired={handleSessionExpired}
          onLogout={handleLogout}
        />
      </GestureHandlerRootView>
    );
  }

  if (screen === 'transactions') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TransactionsFilterScreen
          onGoHome={() => setScreen('home')}
          onSessionExpired={handleSessionExpired}
        />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
