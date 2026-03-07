import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { authStyles } from '../theme/authStyles';

export function AuthCard({ children }) {
  return (
    <View style={authStyles.card}>
      <View style={authStyles.brandContainer}>
        <View style={authStyles.brandRow}>
          <Text style={authStyles.brandText}>VITRIN</Text>
          <View style={authStyles.brandPinWrap}>
            <Feather name="map-pin" size={14} color="#fff" />
          </View>
          <Text style={authStyles.brandText}>VA</Text>
        </View>
        <Text style={authStyles.brandSubtitle}>Marketplace</Text>
      </View>
      {children}
    </View>
  );
}
