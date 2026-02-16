import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getTransactionsByDateRange } from '../services/transactionsService';
import { getCachedSession } from '../services/sessionService';
import { transactionsFilterStyles as styles } from '../theme/transactionsFilterStyles';

const logoUri =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrlgf2hRazz-UN3KEa32BKxj4T0C3RmJ0vCw&s';

function toApiDate(input) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
    const [dd, mm, yyyy] = input.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }

  return '';
}

function toDisplayDate(apiDate) {
  if (!apiDate || !/^\d{4}-\d{2}-\d{2}$/.test(apiDate)) {
    return '';
  }

  const [yyyy, mm, dd] = apiDate.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

function todayApiDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatTxnDate(date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date || '';
  }

  const [year, month, day] = date.split('-').map(Number);
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];

  return `${day} de ${months[(month || 1) - 1]} de ${year}`;
}

function getInitials(clientName = '') {
  const words = clientName.trim().split(' ').filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'CL';
}

export function TransactionsFilterScreen({ onGoHome, onSessionExpired }) {
  const today = useMemo(() => todayApiDate(), []);
  const [startDateInput, setStartDateInput] = useState(toDisplayDate(today));
  const [endDateInput, setEndDateInput] = useState(toDisplayDate(today));
  const [clientName, setClientName] = useState('');

  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState('0');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getCachedSession();

    if (!session?.token) {
      onSessionExpired();
      return;
    }

    const startDateApi = toApiDate(startDateInput);
    const endDateApi = toApiDate(endDateInput);

    if (!startDateApi || !endDateApi) {
      setRows([]);
      setSales('0');
      setError('No se encontraron transacciones.');
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');

        const result = await getTransactionsByDateRange({
          token: session.token,
          startDate: startDateApi,
          endDate: endDateApi,
          clientName,
        });

        if (result.tokenExpired) {
          onSessionExpired();
          return;
        }

        if (!result.ok) {
          setRows([]);
          setSales('0');
          setError('No se encontraron transacciones.');
          return;
        }

        setRows(result.transactions ?? []);
        setSales(result.summary?.ingresos ?? '0');
      } catch (e) {
        setRows([]);
        setSales('0');
        setError('No se encontraron transacciones.');
      } finally {
        setLoading(false);
      }
    }, 320);

    return () => clearTimeout(timeout);
  }, [clientName, endDateInput, onSessionExpired, startDateInput]);

  const handleClear = () => {
    setEndDateInput(toDisplayDate(today));
    setStartDateInput(toDisplayDate(today));
    setClientName('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Image source={{ uri: logoUri }} style={styles.miniLogo} resizeMode="cover" />
          <Pressable style={styles.closeBtn} onPress={onGoHome}>
            <Feather name="x" size={24} color="#23283a" />
          </Pressable>
        </View>

        <Text style={styles.title}>Filtrar Transacciones</Text>

        <View style={styles.datesRow}>
          <TextInput
            value={startDateInput}
            onChangeText={setStartDateInput}
            placeholder="DD/MM/YYYY"
            style={styles.dateInput}
            placeholderTextColor="#8791a2"
          />
          <TextInput
            value={endDateInput}
            onChangeText={setEndDateInput}
            placeholder="DD/MM/YYYY"
            style={styles.dateInput}
            placeholderTextColor="#8791a2"
          />
        </View>

        <TextInput
          value={clientName}
          onChangeText={setClientName}
          placeholder="Nombre del emprendedor"
          style={styles.clientInput}
          placeholderTextColor="#8791a2"
        />

        <View style={styles.salesCard}>
          <Text style={styles.salesTitle}>Ventas</Text>
          <Text style={styles.salesValue}>{Number(sales || 0).toFixed(2)} USD</Text>
        </View>

        {loading ? (
          <Text style={styles.emptyText}>Buscando transacciones...</Text>
        ) : rows.length === 0 ? (
          <Text style={styles.emptyText}>{error || 'No se encontraron transacciones.'}</Text>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const isIncome = item.transaction_type === 'income';
              const sign = isIncome ? '+' : '-';

              return (
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(item.client_name)}</Text>
                  </View>

                  <View style={styles.body}>
                    <Text style={styles.titleText}>{isIncome ? 'Vendiste' : 'Egreso'}</Text>
                    <Text style={styles.subtitleText}>{(item.client_name || 'Cliente').toUpperCase()}</Text>
                    <Text style={styles.dateText}>{formatTxnDate(item.transaction_date)}</Text>
                  </View>

                  <Text style={isIncome ? styles.amountIncome : styles.amountExpense}>
                    {sign}${Number(item.amount || 0).toFixed(2)} USD
                  </Text>
                </View>
              );
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View style={styles.bottomActions}>
        <Pressable style={[styles.actionButton, styles.clearBtn]} onPress={handleClear}>
          <Text style={styles.actionText}>Limpiar Filtros</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.backBtn]} onPress={onGoHome}>
          <Text style={styles.actionText}>Regresar Home</Text>
        </Pressable>
      </View>
    </View>
  );
}
