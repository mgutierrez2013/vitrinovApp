import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthCard } from '../components/AuthCard';
import { authStyles } from '../theme/authStyles';

export function LoginScreen({ onGoRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authOk, setAuthOk] = useState(false);

  const isEmailValid = /^\S+@\S+\.\S+$/.test(email);
  const isPasswordValid = password.length > 5;

  const hasEmailError = submitted && !isEmailValid;
  const hasPasswordError = submitted && !isPasswordValid;

  const handleLogin = () => {
    setSubmitted(true);

    if (isEmailValid && isPasswordValid) {
      setAuthOk(true);
      return;
    }

    setAuthOk(false);
  };

  return (
    <AuthCard>
      <View style={authStyles.fieldBlock}>
        <Text style={authStyles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Ingresa tu email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={[authStyles.input, hasEmailError && authStyles.inputError]}
          placeholderTextColor="#9aa3b2"
        />
        {hasEmailError && <Text style={authStyles.errorText}>Por favor, ingrese un correo válido.</Text>}
      </View>

      <View style={authStyles.fieldBlock}>
        <Text style={authStyles.label}>Contraseña</Text>
        <View style={[authStyles.passwordContainer, hasPasswordError && authStyles.inputError]}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Ingresa tu contraseña"
            secureTextEntry={!showPassword}
            style={authStyles.passwordInput}
            placeholderTextColor="#9aa3b2"
          />
          <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#7b8699" />
          </Pressable>
        </View>
        {hasPasswordError && (
          <Text style={authStyles.errorText}>La contraseña debe tener más de 5 caracteres.</Text>
        )}
      </View>

      <Pressable style={authStyles.ctaButton} onPress={handleLogin}>
        <Text style={authStyles.ctaText}>Ingresar →</Text>
      </Pressable>

      {authOk && <Text style={authStyles.successText}>Autenticación válida (demo visual)</Text>}

      <Pressable onPress={onGoRegister}>
        <Text style={authStyles.switchText}>¿No tienes una cuenta? Registrar</Text>
      </Pressable>
    </AuthCard>
  );
}
