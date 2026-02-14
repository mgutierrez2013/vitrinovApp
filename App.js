import { useState } from 'react';
import {
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

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isEmailValid = /^\S+@\S+\.\S+$/.test(email);
  const isPasswordValid = password.length >= 5;

  return (
    <LinearGradient colors={['#9968f7', '#58b3ff']} style={styles.gradientBackground}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.card}>
            <Text style={styles.brand}>VITRINOVA</Text>
            <Text style={styles.title}>Ingresar</Text>

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
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={22} color="#7b8699" />
                </Pressable>
              </View>
              {password.length > 0 && !isPasswordValid && (
                <Text style={styles.errorText}>La contraseña debe tener al menos 5 caracteres.</Text>
              )}
            </View>

            <Pressable style={styles.ctaButton}>
              <Text style={styles.ctaText}>Ingresar →</Text>
            </Pressable>

            <Text style={styles.registerText}>¿No tienes una cuenta? Registrar</Text>
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
    paddingVertical: 34,
    shadowColor: '#151515',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 6,
  },
  brand: {
    marginTop: 8,
    fontSize: 40,
    textAlign: 'center',
    letterSpacing: 3,
    fontWeight: '300',
    color: '#21222b',
  },
  title: {
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 30,
    fontSize: 42,
    fontWeight: '700',
    color: '#161823',
  },
  fieldBlock: {
    marginBottom: 22,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '600',
    color: '#1d2332',
  },
  input: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#d6dbe7',
    backgroundColor: '#f4f7fb',
    paddingHorizontal: 18,
    height: 56,
    fontSize: 20,
    color: '#273143',
  },
  inputError: {
    borderColor: '#d64c62',
  },
  errorText: {
    color: '#bf4358',
    marginTop: 8,
    fontSize: 15,
    textAlign: 'center',
  },
  passwordContainer: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#d6dbe7',
    backgroundColor: '#f4f7fb',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  passwordInput: {
    flex: 1,
    fontSize: 20,
    color: '#273143',
  },
  ctaButton: {
    marginTop: 10,
    height: 62,
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
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  registerText: {
    marginTop: 24,
    textAlign: 'center',
    color: '#7459cd',
    fontSize: 20,
    fontWeight: '600',
  },
});
