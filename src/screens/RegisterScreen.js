import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthCard } from '../components/AuthCard';
import { authStyles } from '../theme/authStyles';

export function RegisterScreen({ onGoLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authOk, setAuthOk] = useState(false);

  const isNameValid = name.trim().length > 5;
  const isEmailValid = /^\S+@\S+\.\S+$/.test(email);
  const isPasswordValid = password.length > 5;

  const hasNameError = submitted && !isNameValid;
  const hasEmailError = submitted && !isEmailValid;
  const hasPasswordError = submitted && !isPasswordValid;

  const handleRegister = () => {
    setSubmitted(true);

    if (isNameValid && isEmailValid && isPasswordValid) {
      setAuthOk(true);
      return;
    }

    setAuthOk(false);
  };

  return (
    <AuthCard>
      <View style={authStyles.fieldBlock}>
        <Text style={authStyles.label}>Nombre</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ingresa tu nombre"
          style={[authStyles.input, hasNameError && authStyles.inputError]}
          placeholderTextColor="#9aa3b2"
        />
        {hasNameError && (
          <Text style={authStyles.errorText}>El nombre debe tener más de 5 caracteres.</Text>
        )}
      </View>

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

      <Pressable style={authStyles.ctaButton} onPress={handleRegister}>
        <Text style={authStyles.ctaText}>Registrar →</Text>
      </Pressable>

      {authOk && <Text style={authStyles.successText}>Registro válido (demo visual)</Text>}

      <Pressable onPress={onGoLogin}>
        <Text style={authStyles.switchText}>¿Ya tienes una cuenta? Ingresar Sesión</Text>
      </Pressable>
    </AuthCard>
  );
}
