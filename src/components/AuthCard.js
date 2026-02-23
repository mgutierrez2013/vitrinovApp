import { Image, View } from 'react-native';
import { authStyles } from '../theme/authStyles';

const logoUri =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrlgf2hRazz-UN3KEa32BKxj4T0C3RmJ0vCw&s';

export function AuthCard({ children }) {
  return (
    <View style={authStyles.card}>
      <View style={authStyles.brandContainer}>
        <Image
          source={{ uri: logoUri }}
          style={[authStyles.brandImage, { width: 200, height: 200 }]}
          resizeMode="contain"
        />
      </View>
      {children}
    </View>
  );
}
