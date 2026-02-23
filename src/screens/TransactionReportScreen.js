import { useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { getCachedSession } from '../services/sessionService';
import { getTransactionClassificationReport } from '../services/transactionsService';
import { transactionReportStyles as styles } from '../theme/transactionReportStyles';

const logoUri =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrlgf2hRazz-UN3KEa32BKxj4T0C3RmJ0vCw&s';

const TYPE_OPTIONS = ['Todas', 'Efectivo', 'Transferencia', 'Tarjeta', 'Sin categorizar'];

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
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedType, setSelectedType] = useState('Todas');
  const [typeSelectorVisible, setTypeSelectorVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);

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

  const rowsByType = useMemo(() => {
    if (selectedType === 'Todas') {
      return rows;
    }
    return rows.filter((row) => row.tipo === selectedType);
  }, [rows, selectedType]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return rowsByType;
    }

    return rowsByType.filter((row) =>
      row.tipo.toLowerCase().includes(term)
      || row.emprendimiento.toLowerCase().includes(term)
      || row.notas.toLowerCase().includes(term),
    );
  }, [rowsByType, search]);

  const totalsByType = useMemo(() => {
    const totals = {
      Efectivo: 0,
      Transferencia: 0,
      Tarjeta: 0,
      'Sin categorizar': 0,
    };

    filteredRows.forEach((row) => {
      if (Object.prototype.hasOwnProperty.call(totals, row.tipo)) {
        totals[row.tipo] += Number(row.monto || 0);
      }
    });

    return totals;
  }, [filteredRows]);

  const visibleSummary = useMemo(() => {
    if (selectedType === 'Todas') {
      return [
        { key: 'Efectivo', label: 'Efectivo', amount: totalsByType.Efectivo },
        { key: 'Sin categorizar', label: 'Sin categorizar', amount: totalsByType['Sin categorizar'] },
        { key: 'Tarjeta', label: 'Tarjeta', amount: totalsByType.Tarjeta },
        { key: 'Transferencia', label: 'Transferencia', amount: totalsByType.Transferencia },
      ];
    }

    return [{ key: selectedType, label: selectedType, amount: totalsByType[selectedType] || 0 }];
  }, [selectedType, totalsByType]);


  const summaryRows = useMemo(() => {
    if (selectedType !== 'Todas') {
      return [visibleSummary];
    }

    const rowsChunked = [];
    for (let i = 0; i < visibleSummary.length; i += 2) {
      rowsChunked.push(visibleSummary.slice(i, i + 2));
    }
    return rowsChunked;
  }, [selectedType, visibleSummary]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBox}><Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="cover" /></View>
        <Pressable style={styles.logoutButton} onPress={onLogout}><Text style={styles.logoutText}>Cerrar sesión</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={onGoHome}>
          <Feather name="arrow-left" size={16} color="#3d2f86" />
          <Text style={styles.backButtonText}>Regresar</Text>
        </Pressable>

        <Text style={styles.title}>Reporte Transacciones</Text>

        <View style={styles.filtersCard}>
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
            <Pressable style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
              <Text style={styles.dateButtonText}>{toDisplayDate(startDate)}</Text>
            </Pressable>
          )}

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
            <Pressable style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
              <Text style={styles.dateButtonText}>{toDisplayDate(endDate)}</Text>
            </Pressable>
          )}

          <Text style={styles.filterLabel}>Tipo de transacción</Text>
          <Pressable style={styles.typeButton} onPress={() => setTypeSelectorVisible((prev) => !prev)}>
            <Text style={styles.typeButtonText}>{selectedType}</Text>
          </Pressable>

          {typeSelectorVisible ? (
            <View style={styles.typeList}>
              {TYPE_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={styles.typeItem}
                  onPress={() => {
                    setSelectedType(option);
                    setTypeSelectorVisible(false);
                  }}
                >
                  <Text style={styles.typeItemText}>{option}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
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

        <Text style={styles.sectionTitle}>Resumen de Totales</Text>
        <Text style={styles.sectionSubtitle}>Sumatoria de montos por tipo de transacción para los resultados mostrados.</Text>

        {selectedType === 'Todas' ? (
          <View style={styles.summaryGrid}>
            {summaryRows.map((row, rowIndex) => (
              <View key={`summary-row-${rowIndex}`} style={styles.summaryGridRow}>
                {row.map((item) => (
                  <View key={item.key} style={[styles.summaryCard, styles.summaryCardGrid]}>
                    <Text style={styles.summaryLabel}>{item.label}</Text>
                    <Text style={styles.summaryAmount}>{formatMoney(item.amount)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.summarySingleWrap}>
            {visibleSummary.map((item) => (
              <View key={item.key} style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={styles.summaryAmount}>{formatMoney(item.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.resultsTitle}>Resultados del Reporte</Text>
        <Text style={styles.resultsSubtitle}>Se encontraron {filteredRows.length} transacciones que coinciden con los filtros.</Text>

        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#6f7483" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por emprendimiento, notas o tipo..."
            placeholderTextColor="#8a92a1"
            style={styles.searchInput}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.cardsWrap}>
          {loading ? (
            <Text style={styles.emptyText}>Cargando transacciones...</Text>
          ) : filteredRows.length === 0 ? (
            <Text style={styles.emptyText}>No se encontraron transacciones.</Text>
          ) : (
            filteredRows.map((row) => (
              <View key={row.id} style={styles.transactionCard}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Tipo</Text>
                  <Text style={[styles.cardValue, styles.typeValue]}>{row.tipo}</Text>
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Emprendimiento</Text>
                  <Text style={styles.cardValue}>{row.emprendimiento}</Text>
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Fecha</Text>
                  <Text style={styles.cardValue}>{toDisplayDate(parseApiDate(row.fecha) || new Date())}</Text>
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Monto</Text>
                  <Text style={styles.cardValue}>{formatMoney(row.monto)}</Text>
                </View>

                <View style={styles.cardNotesBlock}>
                  <Text style={styles.cardLabel}>Notas</Text>
                  <Text style={styles.cardNotes}>{row.notas || '-'}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
