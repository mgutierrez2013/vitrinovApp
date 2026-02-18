import { Image, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { HomeTransactionsPanel } from '../components/HomeTransactionsPanel';
import { homeStyles } from '../theme/homeStyles';

const logoUri =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrlgf2hRazz-UN3KEa32BKxj4T0C3RmJ0vCw&s';

export function HomeScreen({ onLogout, onSessionExpired, onGoAllTransactions, onGoEntrepreneurs, onGoBankAccounts, onGoNotificationReports }) {
  return (
    <View style={homeStyles.container}>
      <View style={homeStyles.header}>
        <View style={homeStyles.logoBox}>
          <Image source={{ uri: logoUri }} style={homeStyles.logoImage} resizeMode="cover" />
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
      />

      <View style={homeStyles.bottomBar}>
        <View style={homeStyles.bottomIconWrapActive}>
          <Feather name="home" size={24} color="#ffffff" />
        </View>
        <Pressable style={homeStyles.bottomIconWrap} onPress={onGoEntrepreneurs}>
          <Feather name="users" size={24} color="#7c59d7" />
        </Pressable>
        <Pressable style={homeStyles.bottomIconWrap} onPress={onGoBankAccounts}>
          <Feather name="credit-card" size={24} color="#7c59d7" />
        </Pressable>
      </View>
    </View>
  );
}
