import { View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { HomeTransactionsPanel } from '../components/HomeTransactionsPanel';
import { homeStyles } from '../theme/homeStyles';

export function HomeScreen({ onLogout, onSessionExpired, onGoAllTransactions, onGoEntrepreneurs, onGoBankAccounts, onGoNotificationReports, onGoTransactionReports }) {
  const handleFooterChange = (index) => {
    if (index === 1) {
      onGoEntrepreneurs?.();
      return;
    }

    if (index === 2) {
      onGoBankAccounts?.();
    }
  };

  return (
    <View style={homeStyles.container}>
      <AppHeader onLogout={onLogout} />

      <HomeTransactionsPanel
        onSessionExpired={onSessionExpired}
        onGoAllTransactions={onGoAllTransactions}
        onGoNotificationReports={onGoNotificationReports}
        onGoTransactionReports={onGoTransactionReports}
      />

      <AppFooter activeIndex={0} onChange={handleFooterChange} />
    </View>
  );
}
