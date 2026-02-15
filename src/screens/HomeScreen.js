import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, SectionList, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getTransactionsByDateRange } from '../services/transactionsService';
import { getCachedSession } from '../services/sessionService';
import { homeStyles } from '../theme/homeStyles';

const logoUri =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrlgf2hRazz-UN3KEa32BKxj4T0C3RmJ0vCw&s';

function formatApiDate(value) {
  return value.toISOString().slice(0, 10);
}

function getCurrentMonthRange() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    startDate: formatApiDate(firstDay),
    endDate: formatApiDate(now),
  };
}

function formatGroupDate(date) {
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

  return `${String(day).padStart(2, '0')} de ${months[(month || 1) - 1]} de ${year}`;
}

function groupTransactionsByDate(transactions) {
  const grouped = transactions.reduce((acc, item) => {
    const key = item.transaction_date;

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(item);
    return acc;
  }, {});

  return Object.keys(grouped)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((key) => ({
      title: formatGroupDate(key),
      data: grouped[key],
    }));
}

function getInitials(clientName = '') {
  const words = clientName.trim().split(' ').filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'CL';
}

export function HomeScreen({ onLogout, onSessionExpired }) {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState('0');
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const session = getCachedSession();

      if (!session?.token) {
        onSessionExpired();
        return;
      }

      const { startDate, endDate } = getCurrentMonthRange();

      try {
        setLoading(true);
        setError('');

        const result = await getTransactionsByDateRange({
          token: session.token,
          startDate,
          endDate,
        });

        if (result.tokenExpired) {
          onSessionExpired();
          return;
        }

        if (!result.ok) {
          setTransactions([]);
          setSales('0');
          setError('No se obtuvieron resultado.');
          return;
        }

        setSales(result.summary?.ingresos ?? '0');
        setTransactions(result.transactions ?? []);
      } catch (requestError) {
        setTransactions([]);
        setSales('0');
        setError('No se obtuvieron resultado.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [onSessionExpired]);

  const sections = useMemo(() => groupTransactionsByDate(transactions), [transactions]);

  return (
    <View style={homeStyles.container}>
      <View style={homeStyles.header}>
        <View style={homeStyles.logoBox}>
          <Image source={{ uri: logoUri }} style={homeStyles.logoImage} resizeMode="cover" />
        </View>

        <Pressable style={homeStyles.logoutButton} onPress={onLogout}>
          <Text style={homeStyles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>

      <View style={homeStyles.content}>
        <View style={homeStyles.salesCard}>
          <Text style={homeStyles.salesTitle}>Ventas</Text>
          <Text style={homeStyles.salesValue}>${Number(sales || 0).toFixed(2)}</Text>
        </View>

        <View style={homeStyles.sectionHeader}>
          <Text style={homeStyles.sectionTitle}>Transacciones</Text>
          <Text style={homeStyles.sectionLink}>Ver todo</Text>
        </View>

        {loading ? (
          <Text style={homeStyles.emptyText}>Cargando transacciones...</Text>
        ) : error ? (
          <Text style={homeStyles.emptyText}>{error}</Text>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => String(item.id)}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={homeStyles.dateTitle}>{title}</Text>
            )}
            renderItem={({ item }) => {
              const isIncome = item.transaction_type === 'income';
              const sign = isIncome ? '+' : '-';

              return (
                <View style={homeStyles.transactionRow}>
                  <View style={homeStyles.avatar}>
                    <Text style={homeStyles.avatarText}>{getInitials(item.client_name)}</Text>
                  </View>

                  <View style={homeStyles.transactionBody}>
                    <Text style={homeStyles.transactionTitle}>{isIncome ? 'Vendiste' : 'Egreso'}</Text>
                    <Text style={homeStyles.transactionSubtitle}>{item.client_name || 'Cliente'}</Text>
                  </View>

                  <Text style={[homeStyles.amountText, isIncome ? homeStyles.amountIncome : homeStyles.amountExpense]}>
                    {sign}${Number(item.amount || 0).toFixed(2)} USD
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={homeStyles.emptyText}>No se obtuvieron resultado.</Text>}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 320 }}
          />
        )}

        <View style={homeStyles.divider} />

        <Pressable style={homeStyles.registerSaleButton}>
          <Text style={homeStyles.registerSaleText}>Registrar Venta</Text>
        </Pressable>
      </View>

      <View style={homeStyles.bottomBar}>
        <View style={homeStyles.bottomIconWrapActive}>
          <Feather name="home" size={24} color="#ffffff" />
        </View>
        <View style={homeStyles.bottomIconWrap}>
          <Feather name="users" size={24} color="#7c59d7" />
        </View>
        <View style={homeStyles.bottomIconWrap}>
          <Feather name="settings" size={24} color="#7c59d7" />
        </View>
      </View>
    </View>
  );
}
