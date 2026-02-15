import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AuthCard } from '../components/AuthCard';
import { authStyles } from '../theme/authStyles';
import { registerRequest } from '../services/authService';

export function RegisterScreen({ onGoLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const isNameValid = name.trim().length > 5;
  const isEmailValid = /^\S+@\S+\.\S+$/.test(email);
  const isPasswordValid = password.length > 5;

  const hasNameError = submitted && !isNameValid;
  const hasEmailError = submitted && !isEmailValid;
  const hasPasswordError = submitted && !isPasswordValid;

  const handleRegister = async () => {
    setSubmitted(true);

    if (!isNameValid || !isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      setLoading(true);
      const result = await registerRequest({ name, email, password });
      setModalMessage(result.message);
      setModalVisible(true);
    } catch (error) {
      setModalMessage('No fue posible conectar con el servidor.');
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

        <Pressable style={[authStyles.ctaButton, loading && authStyles.ctaButtonDisabled]} onPress={handleRegister}>
          <Text style={authStyles.ctaText}>{loading ? 'Validando...' : 'Registrar →'}</Text>
        </Pressable>

        <Pressable onPress={onGoLogin}>
          <Text style={authStyles.switchText}>¿Ya tienes una cuenta? Ingresar Sesión</Text>
        </Pressable>
      </AuthCard>

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={authStyles.modalBackdrop}>
          <View style={authStyles.modalCard}>
            <Text style={authStyles.modalTitle}>Resultado del registro</Text>
            <Text style={authStyles.modalMessage}>{modalMessage}</Text>

            <View style={authStyles.modalButtonsRow}>
              <Pressable
                style={[authStyles.modalButton, authStyles.modalButtonSecondary]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={authStyles.modalButtonTextSecondary}>Cerrar</Text>
              </Pressable>

              <Pressable
                style={[authStyles.modalButton, authStyles.modalButtonPrimary]}
                onPress={() => {
                  setModalVisible(false);
                  onGoLogin();
                }}
              >
                <Text style={authStyles.modalButtonTextPrimary}>Ir a Login</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
