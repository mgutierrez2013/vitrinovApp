import { View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { HomeTransactionsPanel } from '../components/HomeTransactionsPanel';
import { homeStyles } from '../theme/homeStyles';

export function HomeScreen({ onLogout, onSessionExpired, onGoAllTransactions, onGoEntrepreneurs, onGoBankAccounts, onGoNotificationReports, onGoTransactionReports }) {
  return (
    <View style={homeStyles.container}>
      <AppHeader
        onLogout={onLogout}
        onGoHome={undefined}
        onGoEntrepreneurs={onGoEntrepreneurs}
        onGoBankAccounts={onGoBankAccounts}
        activeTab="home"
      />

      <HomeTransactionsPanel
        onSessionExpired={onSessionExpired}
        onGoAllTransactions={onGoAllTransactions}
        onGoNotificationReports={onGoNotificationReports}
        onGoTransactionReports={onGoTransactionReports}
      />

    </View>
  );
}
