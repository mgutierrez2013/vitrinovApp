import { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getCachedSession } from '../services/sessionService';
import { getTransactionClassificationReport } from '../services/transactionsService';
import { transactionReportStyles as styles } from '../theme/transactionReportStyles';

const logoUri =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrlgf2hRazz-UN3KEa32BKxj4T0C3RmJ0vCw&s';

const TYPE_OPTIONS = ['Todas', 'Efectivo', 'Tarjeta', 'Transferencia', 'Sin categorizar'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEK_DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

const TYPE_COLOR = {
  Efectivo: { bg: '#E8F8F0', color: '#1A9E5C' },
  Tarjeta: { bg: '#EAF2FF', color: '#2563A8' },
  Transferencia: { bg: '#F0EAFF', color: '#7C3AED' },
  'Sin categorizar': { bg: '#FFF4E5', color: '#E08A00' },
};

function toApiDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseApiDate(dateString) {
  const [year, month, day] = String(dateString || '').split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function toDisplayDate(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
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

function formatMoney(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'TR';
}

function normalizeRows(rawData) {
  const rows = [];

  Object.entries(rawData || {}).forEach(([type, values]) => {
    if (!Array.isArray(values)) {
      return;
    }

    values.forEach((item, index) => {
      rows.push({
        id: `${type}-${index}-${item?.fecha || ''}-${item?.monto || 0}`,
        tipo: type,
        emprendimiento: (item?.emprendimiento || '').toUpperCase(),
        fecha: item?.fecha || '',
        monto: Number(item?.monto || 0),
        notas: item?.notas || '',
      });
    });
  });

  return rows.sort((a, b) => (a.fecha > b.fecha ? -1 : 1));
}

export function TransactionReportScreen({ onGoHome, onSessionExpired, onLogout }) {
  const today = useMemo(() => todayInElSalvador(), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [webStartDateInput, setWebStartDateInput] = useState(toApiDate(today));
  const [webEndDateInput, setWebEndDateInput] = useState(toApiDate(today));
  const [selectedType, setSelectedType] = useState('Todas');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [expandedMap, setExpandedMap] = useState({});

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
      const result = await getTransactionClassificationReport({
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
        setRows([]);
        setError(result.message || 'No fue posible obtener el reporte.');
        return;
      }

      setRows(normalizeRows(result.raw));
      setExpandedMap({});
    } catch (_error) {
      setRows([]);
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

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const inRange = (!startDate || row.fecha >= toApiDate(startDate)) && (!endDate || row.fecha <= toApiDate(endDate));
      const inType = selectedType === 'Todas' || row.tipo === selectedType;
      const inSearch = !term
        || row.tipo.toLowerCase().includes(term)
        || row.emprendimiento.toLowerCase().includes(term)
        || row.notas.toLowerCase().includes(term);

      return inRange && inType && inSearch;
    });
  }, [rows, search, selectedType, startDate, endDate]);

  const totalsByType = useMemo(() => {
    const totals = {
      Efectivo: 0,
      Tarjeta: 0,
      Transferencia: 0,
      'Sin categorizar': 0,
    };

    filteredRows.forEach((row) => {
      if (Object.prototype.hasOwnProperty.call(totals, row.tipo)) {
        totals[row.tipo] += Number(row.monto || 0);
      }
    });

    return totals;
  }, [filteredRows]);

  const grandTotal = useMemo(() => {
    return filteredRows.reduce((sum, row) => sum + Number(row.monto || 0), 0);
  }, [filteredRows]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBox}><Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="cover" /></View>
        <Pressable style={styles.logoutButton} onPress={onLogout}><Text style={styles.logoutText}>Cerrar sesión</Text></Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.titleOverline}>Informe</Text>
            <Text style={styles.title}>Reporte Transacciones</Text>
          </View>

          <Pressable style={styles.backButtonTop} onPress={onGoHome}>
            <View style={styles.backButtonTopIconWrap}>
              <Feather name="arrow-left" size={13} color="#fff" />
            </View>
            <Text style={styles.backButtonTopText}>Regresar</Text>
          </Pressable>
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
                />
              ) : (
                <Pressable style={styles.dateButton} onPress={() => openDatePicker('end')}>
                  <Text style={styles.dateButtonText}>📅 {toDisplayDate(endDate)}</Text>
                </Pressable>
              )}
            </View>
          </View>

          <Text style={styles.filterLabel}>Tipo de transacción</Text>
          <View style={styles.typeChipsWrap}>
            {TYPE_OPTIONS.map((type) => (
              <Pressable
                key={type}
                style={[styles.typeChip, selectedType === type && styles.typeChipActive]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[styles.typeChipText, selectedType === type && styles.typeChipTextActive]}>{type}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Resumen de Totales</Text>
          <Text style={styles.sectionSubtitle}>Sumatoria por tipo de transacción.</Text>

          <View style={styles.summaryGrid}>
            {Object.entries(totalsByType).map(([type, amount]) => {
              const colors = TYPE_COLOR[type] || { color: '#555' };
              return (
                <View key={type} style={[styles.summaryCard, { borderTopColor: colors.color }]}> 
                  <Text style={[styles.summaryLabel, { color: colors.color }]}>{type}</Text>
                  <Text style={styles.summaryAmount}>{formatMoney(amount)}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.grandTotalCard}>
            <Text style={styles.grandTotalLabel}>Total General</Text>
            <Text style={styles.grandTotalAmount}>{formatMoney(grandTotal)}</Text>
          </View>
        </View>

        <Text style={styles.resultsTitle}>Resultados del Reporte</Text>
        <Text style={styles.resultsSubtitle}>Se encontraron {filteredRows.length} transacciones.</Text>

        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#6f7483" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por emprendimiento, notas o tipo..."
            placeholderTextColor="#8a92a1"
            style={styles.searchInput}
          />
          {!!search && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </Pressable>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.cardsWrap}>
          {loading ? (
            <Text style={styles.emptyText}>Cargando transacciones...</Text>
          ) : filteredRows.length === 0 ? (
            <Text style={styles.emptyText}>No se encontraron transacciones.</Text>
          ) : (
            filteredRows.map((row) => {
              const colors = TYPE_COLOR[row.tipo] || { bg: '#F2F4F7', color: '#555' };
              const expanded = !!expandedMap[row.id];
              const displayDate = toDisplayDate(parseApiDate(row.fecha) || new Date());
              return (
                <Pressable
                  key={row.id}
                  style={styles.transactionCard}
                  onPress={() => setExpandedMap((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                >
                  <View style={styles.txMainRow}>
                    <View style={styles.txAvatar}>
                      <Text style={styles.txAvatarText}>{getInitials(row.emprendimiento)}</Text>
                    </View>
                    <View style={styles.txMainBody}>
                      <Text style={styles.txEmpName} numberOfLines={1}>{row.emprendimiento}</Text>
                      <Text style={styles.txDate}>{displayDate}</Text>
                    </View>

                    <View style={styles.txRightCol}>
                      <Text style={styles.txAmount}>{formatMoney(row.monto)}</Text>
                      <View style={[styles.txTypePill, { backgroundColor: colors.bg }]}> 
                        <Text style={[styles.txTypePillText, { color: colors.color }]}>{row.tipo}</Text>
                      </View>
                    </View>

                    <Text style={styles.txExpandIcon}>{expanded ? '▲' : '▼'}</Text>
                  </View>

                  {expanded ? (
                    <View style={styles.txDetailsWrap}>
                      <View style={styles.txDetailGrid}>
                        {[
                          { label: 'Tipo', value: row.tipo },
                          { label: 'Monto', value: `${formatMoney(row.monto)} USD` },
                          { label: 'Fecha', value: displayDate },
                          { label: 'Emprendimiento', value: row.emprendimiento },
                        ].map((item) => (
                          <View key={item.label} style={styles.txDetailItem}>
                            <Text style={styles.txDetailLabel}>{item.label}</Text>
                            <Text style={styles.txDetailValue}>{item.value}</Text>
                          </View>
                        ))}
                      </View>

                      {row.notas ? (
                        <View style={styles.txNotesBox}>
                          <Text style={styles.txNotesLabel}>Notas</Text>
                          <Text style={styles.txNotesText}>{row.notas}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

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
