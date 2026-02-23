import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import { getCachedSession } from '../services/sessionService';
import { getTransferNotificationReport } from '../services/transactionsService';
import { notificationReportStyles as styles } from '../theme/notificationReportStyles';

const logoUri =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrlgf2hRazz-UN3KEa32BKxj4T0C3RmJ0vCw&s';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEK_DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

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
  const [webStartDateInput, setWebStartDateInput] = useState(toApiDate(today));
  const [webEndDateInput, setWebEndDateInput] = useState(toApiDate(today));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarField, setCalendarField] = useState('start');
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());

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
      setCopied(false);
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

  const openDatePicker = (field) => {
    const source = field === 'start' ? startDate : endDate;
    const next = source instanceof Date ? source : today;
    setCalendarField(field);
    setCalendarYear(next.getFullYear());
    setCalendarMonth(next.getMonth());
    setCalendarVisible(true);
  };

  const goPrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((prev) => prev - 1);
      return;
    }

    setCalendarMonth((prev) => prev - 1);
  };

  const goNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((prev) => prev + 1);
      return;
    }

    setCalendarMonth((prev) => prev + 1);
  };

  const calendarCells = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const cells = Array(offset).fill(null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(day);
    }

    return cells;
  }, [calendarMonth, calendarYear]);

  const selectedForCalendar = useMemo(() => {
    return calendarField === 'start' ? startDate : endDate;
  }, [calendarField, startDate, endDate]);

  const handleSelectCalendarDay = async (day) => {
    if (!day) {
      return;
    }

    const mm = String(calendarMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const selectedDate = new Date(`${calendarYear}-${mm}-${dd}T00:00:00`);

    await handleDateChange(calendarField, selectedDate);
    setCalendarVisible(false);
  };

  const handleCopy = async () => {
    if (!message.trim()) {
      return;
    }

    await Clipboard.setStringAsync(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <View style={styles.titleWrap}>
          <Text style={styles.titleOverline}>Informe</Text>
          <Text style={styles.title}>Reporte Notificaciones</Text>
        </View>

        <View style={styles.filtersCard}>
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
                <Pressable style={styles.dateButton} onPress={() => openDatePicker('start')}>
                  <Text style={styles.dateButtonText}>📅 {toDisplayDate(startDate)}</Text>
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
                <Pressable style={styles.dateButton} onPress={() => openDatePicker('end')}>
                  <Text style={styles.dateButtonText}>📅 {toDisplayDate(endDate)}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Mensaje</Text>
        <View style={styles.messageBox}>
          <ScrollView style={styles.messageScroll} contentContainerStyle={styles.messageContent}>
            <Text style={styles.messageText}>{loading ? 'Cargando reporte...' : message || 'Sin mensaje disponible.'}</Text>
          </ScrollView>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={[styles.copyButton, copied ? styles.copyButtonDone : null]} onPress={handleCopy}>
          <Text style={styles.copyButtonText}>{copied ? '✓ Copiado' : '📋 Copiar'}</Text>
        </Pressable>

        <Pressable style={styles.backButton} onPress={onGoHome}>
          <Feather name="arrow-left" size={16} color="#2563A8" />
          <Text style={styles.backButtonText}>Regresar</Text>
        </Pressable>
      </View>

      <Modal transparent animationType="fade" visible={calendarVisible} onRequestClose={() => setCalendarVisible(false)}>
        <View style={styles.calendarBackdrop}>
          <View style={styles.calendarModalCard}>
            <Text style={styles.pickerTitle}>{calendarField === 'start' ? 'Fecha inicio' : 'Fecha fin'}</Text>

            <View style={styles.calendarNavRow}>
              <Pressable style={styles.calendarNavBtn} onPress={goPrevMonth}>
                <Text style={styles.calendarNavBtnText}>‹</Text>
              </Pressable>
              <Text style={styles.calendarMonthTitle}>{MONTHS[calendarMonth]} {calendarYear}</Text>
              <Pressable style={styles.calendarNavBtn} onPress={goNextMonth}>
                <Text style={styles.calendarNavBtnText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.calendarGrid}>
              {WEEK_DAYS.map((day) => (
                <Text key={day} style={styles.calendarWeekDay}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarCells.map((day, index) => {
                const isSelected = day
                  && selectedForCalendar.getFullYear() === calendarYear
                  && selectedForCalendar.getMonth() === calendarMonth
                  && selectedForCalendar.getDate() === day;

                return (
                  <Pressable
                    key={`${day || 'blank'}-${index}`}
                    disabled={!day}
                    onPress={() => handleSelectCalendarDay(day)}
                    style={[styles.calendarDayCell, isSelected && styles.calendarDayCellSelected]}
                  >
                    <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>{day || ''}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
