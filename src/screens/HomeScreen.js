import { Image, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { HomeTransactionsPanel } from '../components/HomeTransactionsPanel';
import { homeStyles } from '../theme/homeStyles';

const logoUri =
  'https://img.icons8.com/color/192/online-store.png';

export function HomeScreen({ onLogout, onSessionExpired, onGoAllTransactions, onGoEntrepreneurs, onGoBankAccounts, onGoNotificationReports, onGoTransactionReports }) {
  return (
    <View style={homeStyles.container}>
      <View style={homeStyles.header}>
        <View style={homeStyles.logoBox}>
          <Image source={{ uri: logoUri }} style={homeStyles.logoImage} resizeMode="contain" />
        </View>

        <Pressable style={homeStyles.logoutButton} onPress={onLogout}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="log-out" size={15} color="#ffffff" />
            <Text style={homeStyles.logoutText}>Cerrar sesión</Text>
          </View>
        </Pressable>
      </View>

      <HomeTransactionsPanel
        onSessionExpired={onSessionExpired}
        onGoAllTransactions={onGoAllTransactions}
        onGoNotificationReports={onGoNotificationReports}
        onGoTransactionReports={onGoTransactionReports}
      />

      <View style={homeStyles.bottomBar}>
        <View style={homeStyles.bottomIconWrapActive}>
          <Feather name="home" size={24} color="#0f6dbb" />
        </View>
        <Pressable style={homeStyles.bottomIconWrap} onPress={onGoEntrepreneurs}>
          <Feather name="users" size={24} color="#0f6dbb" />
        </Pressable>
        <Pressable style={homeStyles.bottomIconWrap} onPress={onGoBankAccounts}>
          <Feather name="credit-card" size={24} color="#0f6dbb" />
        </Pressable>
      </View>
    </View>
  );
}
