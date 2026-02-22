import { useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import { getCachedSession } from '../services/sessionService';
import { getTransferNotificationReport } from '../services/transactionsService';
import { notificationReportStyles as styles } from '../theme/notificationReportStyles';

const logoUri =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrlgf2hRazz-UN3KEa32BKxj4T0C3RmJ0vCw&s';

function toApiDate(date) {
  return date.toISOString().slice(0, 10);
}

function toDisplayDate(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function parseApiDate(dateString) {
  const [year, month, day] = String(dateString || '').split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function todayInElSalvador() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/El_Salvador',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const value = formatter.format(new Date());
  return parseApiDate(value) || new Date();
}

export function NotificationReportScreen({ onGoHome, onSessionExpired, onLogout }) {
  const today = useMemo(() => todayInElSalvador(), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [webStartDateInput, setWebStartDateInput] = useState(toApiDate(today));
  const [webEndDateInput, setWebEndDateInput] = useState(toApiDate(today));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    const run = async () => {
      await fetchReport(startDate, endDate);
    };

    run();
  }, []);

  const fetchReport = async (nextStart, nextEnd) => {
    const session = getCachedSession();

    if (!session?.token) {
      onSessionExpired();
      return;
    }

    const userId =
      session?.user?.id ??
      session?.user?.user_id ??
      session?.user?.id_usuario ??
      session?.user?.idUser ??
      '';

    try {
      setLoading(true);
      setError('');
      setCopyMessage('');
      const result = await getTransferNotificationReport({
        token: session.token,
        userId: String(userId),
        startDate: toApiDate(nextStart),
        endDate: toApiDate(nextEnd),
      });

      if (result.tokenExpired) {
        onSessionExpired();
        return;
      }

      if (!result.ok) {
        setMessage('');
        setError(result.message || 'No fue posible obtener el reporte.');
        return;
      }

      setMessage(result.message || '');
    } catch (_error) {
      setMessage('');
      setError('No fue posible obtener el reporte.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (field, nextDate) => {
    if (!nextDate) {
      return;
    }

    let computedStart = startDate;
    let computedEnd = endDate;

    if (field === 'start') {
      computedStart = nextDate;
      if (computedStart > computedEnd) {
        computedEnd = computedStart;
      }
    } else {
      computedEnd = nextDate;
      if (computedEnd < computedStart) {
        computedStart = computedEnd;
      }
    }

    setStartDate(computedStart);
    setEndDate(computedEnd);
    setWebStartDateInput(toApiDate(computedStart));
    setWebEndDateInput(toApiDate(computedEnd));
    await fetchReport(computedStart, computedEnd);
  };

  const handleWebDateChange = async (field, value) => {
    const nextDate = parseApiDate(value);
    if (!nextDate) {
      return;
    }

    if (field === 'start') {
      setWebStartDateInput(value);
    } else {
      setWebEndDateInput(value);
    }

    await handleDateChange(field, nextDate);
  };

  const handleCopy = async () => {
    if (!message.trim()) {
      return;
    }

    await Clipboard.setStringAsync(message);
    setCopyMessage('Texto copiado al portapapeles.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="cover" />
        </View>
        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Pressable style={styles.backButton} onPress={onGoHome}>
          <Feather name="arrow-left" size={16} color="#3d2f86" />
          <Text style={styles.backButtonText}>Regresar</Text>
        </Pressable>

        <Text style={styles.title}>Reporte Notificaciones</Text>

        <View style={styles.filtersRow}>
          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>Fecha inicio *</Text>
            {Platform.OS === 'web' ? (
              <TextInput
                value={webStartDateInput}
                onChangeText={(value) => handleWebDateChange('start', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#8a92a1"
                style={styles.webDateInput}
                keyboardType="numbers-and-punctuation"
                type="date"
                autoCapitalize="none"
                autoCorrect={false}
              />
            ) : (
              <Pressable style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                <Text style={styles.dateButtonText}>{toDisplayDate(startDate)}</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>Fecha fin *</Text>
            {Platform.OS === 'web' ? (
              <TextInput
                value={webEndDateInput}
                onChangeText={(value) => handleWebDateChange('end', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#8a92a1"
                style={styles.webDateInput}
                keyboardType="numbers-and-punctuation"
                type="date"
                autoCapitalize="none"
                autoCorrect={false}
              />
            ) : (
              <Pressable style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                <Text style={styles.dateButtonText}>{toDisplayDate(endDate)}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {showStartPicker && Platform.OS !== 'web' ? (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={endDate}
            onChange={(_event, selectedDate) => {
              setShowStartPicker(Platform.OS === 'ios');
              if (selectedDate) {
                handleDateChange('start', selectedDate);
              }
            }}
          />
        ) : null}

        {showEndPicker && Platform.OS !== 'web' ? (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={startDate}
            onChange={(_event, selectedDate) => {
              setShowEndPicker(Platform.OS === 'ios');
              if (selectedDate) {
                handleDateChange('end', selectedDate);
              }
            }}
          />
        ) : null}

        <Text style={styles.sectionLabel}>Mensaje</Text>
        <View style={styles.messageBox}>
          <ScrollView style={styles.messageScroll} contentContainerStyle={styles.messageContent}>
            <Text style={styles.messageText}>{loading ? 'Cargando reporte...' : message || 'Sin mensaje disponible.'}</Text>
          </ScrollView>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {copyMessage ? <Text style={styles.successText}>{copyMessage}</Text> : null}

        <Pressable style={styles.copyButton} onPress={handleCopy}>
          <Text style={styles.copyButtonText}>Copiar</Text>
        </Pressable>
      </View>
    </View>
  );
}
