import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthCard } from '../components/AuthCard';
import { authStyles } from '../theme/authStyles';
import { loginRequest } from '../services/authService';

export function LoginScreen({ onGoRegister, onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState('');

  const isEmailValid = /^\S+@\S+\.\S+$/.test(email);
  const isPasswordValid = password.length >= 5;

  const hasEmailError = submitted && !isEmailValid;
  const hasPasswordError = submitted && !isPasswordValid;

  const handleLogin = async () => {
    setSubmitted(true);
    setApiMessage('');

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      setLoading(true);
      const result = await loginRequest({ email, password });

      if (result.ok) {
        await onAuthSuccess({ token: result.token, user: result.user });
        return;
      }

      setApiMessage(result.message);
    } catch (_error) {
      setApiMessage('No fue posible conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <View style={authStyles.welcomeWrap}>
        <Text style={authStyles.welcomeTitle}>¡Bienvenido de nuevo!</Text>
        <Text style={authStyles.welcomeSubtitle}>Inicia sesión para continuar</Text>
      </View>

      <View style={authStyles.fieldBlock}>
        <Text style={authStyles.label}>Email</Text>
        <View style={[authStyles.inputWrap, hasEmailError && authStyles.inputError]}>
          <Feather name="mail" size={16} color="#99a0ad" />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Ingresa tu email"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
            keyboardType="email-address"
            selectionColor="#f5a623"
            style={authStyles.inputControl}
            placeholderTextColor="#9aa3b2"
          />
        </View>
        {hasEmailError && <Text style={authStyles.errorText}>Por favor, ingrese un correo válido.</Text>}
      </View>

      <View style={authStyles.fieldBlock}>
        <Text style={authStyles.label}>Contraseña</Text>
        <View style={[authStyles.inputWrap, hasPasswordError && authStyles.inputError]}>
          <Feather name="lock" size={16} color="#99a0ad" />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Ingresa tu contraseña"
            secureTextEntry={!showPassword}
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
            selectionColor="#f5a623"
            style={authStyles.inputControl}
            placeholderTextColor="#9aa3b2"
          />
          <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#7b8699" />
          </Pressable>
        </View>
        {hasPasswordError && (
          <Text style={authStyles.errorText}>La contraseña debe tener 5 o más caracteres.</Text>
        )}
      </View>

      {apiMessage.length > 0 && <Text style={authStyles.errorText}>{apiMessage}</Text>}

      <Pressable style={[authStyles.ctaButton, loading && authStyles.ctaButtonDisabled]} onPress={handleLogin}>
        <Text style={authStyles.ctaText}>{loading ? 'Ingresando...' : 'Ingresar  →'}</Text>
      </Pressable>

      <View style={authStyles.separatorRow}>
        <View style={authStyles.separatorLine} />
        <Text style={authStyles.separatorText}>o</Text>
        <View style={authStyles.separatorLine} />
      </View>

      <Pressable onPress={onGoRegister}>
        <Text style={authStyles.switchText}>¿No tienes una cuenta? Registrar</Text>
      </Pressable>
    </AuthCard>
  );
}
