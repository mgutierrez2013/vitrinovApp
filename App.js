import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

const logoUri =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrlgf2hRazz-UN3KEa32BKxj4T0C3RmJ0vCw&s';

export default function App() {
  const [screen, setScreen] = useState('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isEmailValid = /^\S+@\S+\.\S+$/.test(email);
  const isPasswordValid = password.length >= 5;
  const isNameValid = name.trim().length >= 5;

  const isRegister = screen === 'register';

  return (
    <LinearGradient colors={['#9968f7', '#58b3ff']} style={styles.gradientBackground}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.card}>
            <View style={styles.brandContainer}>
              <Image
                source={{
                  uri: logoUri,
                }}
                style={[styles.brandImage, { width: 200, height: 200 }]}
                resizeMode="contain"
              />
            </View>

            {isRegister && (
              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Ingresa tu nombre"
                  style={[styles.input, name.length > 0 && !isNameValid && styles.inputError]}
                  placeholderTextColor="#9aa3b2"
                />
                {name.length > 0 && !isNameValid && (
                  <Text style={styles.errorText}>El nombre debe tener al menos 5 caracteres.</Text>
                )}
              </View>
            )}

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Ingresa tu email"
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.input, email.length > 0 && !isEmailValid && styles.inputError]}
                placeholderTextColor="#9aa3b2"
              />
              {email.length > 0 && !isEmailValid && (
                <Text style={styles.errorText}>Por favor, ingrese un correo válido.</Text>
              )}
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Contraseña</Text>
              <View
                style={[
                  styles.passwordContainer,
                  password.length > 0 && !isPasswordValid && styles.inputError,
                ]}
              >
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Ingresa tu contraseña"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  placeholderTextColor="#9aa3b2"
                />
                <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#7b8699" />
                </Pressable>
              </View>
              {password.length > 0 && !isPasswordValid && (
                <Text style={styles.errorText}>La contraseña debe tener al menos 5 caracteres.</Text>
              )}
            </View>

            <Pressable style={styles.ctaButton}>
              <Text style={styles.ctaText}>{isRegister ? 'Registrar →' : 'Ingresar →'}</Text>
            </Pressable>

            {isRegister ? (
              <Pressable onPress={() => setScreen('login')}>
                <Text style={styles.registerText}>¿Ya tienes una cuenta? Ingresar Sesión</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => setScreen('register')}>
                <Text style={styles.registerText}>¿No tienes una cuenta? Registrar</Text>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  card: {
    borderRadius: 32,
    backgroundColor: '#ffffff',
    paddingHorizontal: 26,
    paddingVertical: 24,
    shadowColor: '#151515',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 6,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 2,
  },
  brandImage: {
    width: '94%',
    height: 108,
  },
  fieldBlock: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '700',
    color: '#1d2332',
  },
  input: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#d6dbe7',
    backgroundColor: '#f4f7fb',
    paddingHorizontal: 16,
    height: 44,
    fontSize: 16,
    color: '#273143',
  },
  inputError: {
    borderColor: '#d64c62',
  },
  errorText: {
    color: '#bf4358',
    marginTop: 5,
    fontSize: 12,
    textAlign: 'center',
  },
  passwordContainer: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#d6dbe7',
    backgroundColor: '#f4f7fb',
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#273143',
  },
  ctaButton: {
    marginTop: 6,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#bba8f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7b59df',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  ctaText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  registerText: {
    marginTop: 14,
    textAlign: 'center',
    color: '#7459cd',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
