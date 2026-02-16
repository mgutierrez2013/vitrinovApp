import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  addTransaction,
  getClientsList,
  getTransactionsByDateRange,
} from '../services/transactionsService';
import { getCachedSession } from '../services/sessionService';
import { homeStyles } from '../theme/homeStyles';

const logoUri =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrlgf2hRazz-UN3KEa32BKxj4T0C3RmJ0vCw&s';
const EL_SALVADOR_TZ = 'America/El_Salvador';

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

function formatDatePartsInElSalvador(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EL_SALVADOR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));

  return {
    dateApi: `${map.year}-${map.month}-${map.day}`,
    dateDisplay: `${Number(map.day)}/${Number(map.month)}/${map.year}, ${map.hour}:${map.minute}:${map.second} ${map.dayPeriod}`,
  };
}

export function HomeScreen({ onLogout, onSessionExpired, onGoAllTransactions }) {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState('0');
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  const [saleModalVisible, setSaleModalVisible] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientSelectorVisible, setClientSelectorVisible] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClientName, setSelectedClientName] = useState('Selecciona un emprendedor');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [imageAsset, setImageAsset] = useState(null);
  const [saleDateApi, setSaleDateApi] = useState('');
  const [saleDateDisplay, setSaleDateDisplay] = useState('');
  const [saleLoading, setSaleLoading] = useState(false);
  const [saleMessage, setSaleMessage] = useState('');

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
  }, [onSessionExpired, refreshTick]);

  const sections = useMemo(() => groupTransactionsByDate(transactions), [transactions]);
  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase();

    if (!term) {
      return clients;
    }

    return clients.filter((item) => (item?.name || '').toLowerCase().includes(term));
  }, [clientSearch, clients]);

  const openSaleModal = async () => {
    const now = formatDatePartsInElSalvador(new Date());
    setSaleDateApi(now.dateApi);
    setSaleDateDisplay(now.dateDisplay);
    setSaleModalVisible(true);
    setSaleMessage('');

    const session = getCachedSession();

    if (!session?.token) {
      onSessionExpired();
      return;
    }

    try {
      setClientsLoading(true);
      const result = await getClientsList({ token: session.token });

      if (result.tokenExpired) {
        setSaleModalVisible(false);
        onSessionExpired();
        return;
      }

      if (result.ok) {
        setClients(result.clients);
      } else {
        setClients([]);
        setSaleMessage(result.message || 'No se obtuvieron resultado.');
      }
    } catch (e) {
      setClients([]);
      setSaleMessage('No se obtuvieron resultado.');
    } finally {
      setClientsLoading(false);
    }
  };

  const closeSaleModal = () => {
    setSaleModalVisible(false);
    setClientSelectorVisible(false);
    setSelectedClientId('');
    setSelectedClientName('Selecciona un emprendedor');
    setAmount('');
    setNotes('');
    setImageAsset(null);
    setSaleMessage('');
    setClientSearch('');
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const original = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        original.uri,
        [{ resize: { width: 1280 } }],
        {
          compress: 0.55,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      setImageAsset({
        ...original,
        uri: manipulated.uri,
        mimeType: 'image/jpeg',
        fileName: original.fileName || `sale_${Date.now()}.jpg`,
      });
    } catch (errorPick) {
      setSaleMessage('No fue posible seleccionar la imagen.');
    }
  };

  const handleAmountChange = (value) => {
    const normalized = value.replace(',', '.');
    if (/^\d*(\.\d{0,2})?$/.test(normalized)) {
      setAmount(normalized);
    }
  };

  const handleConfirmSale = async () => {
    const session = getCachedSession();

    if (!session?.token) {
      setSaleModalVisible(false);
      onSessionExpired();
      return;
    }

    if (!selectedClientId) {
      setSaleMessage('Selecciona un emprendedor.');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setSaleMessage('Ingresa una cantidad válida.');
      return;
    }

    const timestamp = formatDatePartsInElSalvador(new Date());

    try {
      setSaleLoading(true);
      setSaleMessage('');

      const result = await addTransaction({
        token: session.token,
        clientId: selectedClientId,
        amount: Number(amount).toFixed(2),
        notes,
        transactionDate: timestamp.dateApi,
        image: imageAsset,
      });

      if (result.tokenExpired) {
        setSaleModalVisible(false);
        onSessionExpired();
        return;
      }

      if (!result.ok) {
        setSaleMessage(result.message || 'No fue posible registrar la transacción.');
        return;
      }

      closeSaleModal();
      setRefreshTick((prev) => prev + 1);
    } catch (e) {
      setSaleMessage('No fue posible registrar la transacción.');
    } finally {
      setSaleLoading(false);
    }
  };

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
          <Pressable onPress={onGoAllTransactions}>
            <Text style={homeStyles.sectionLink}>Ver todo</Text>
          </Pressable>
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
              <View style={homeStyles.stickyDateHeaderWrap}>
                <Text style={homeStyles.dateTitle}>{title}</Text>
              </View>
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
                    <Text style={homeStyles.transactionSubtitle}>
                      {(item.client_name || 'Cliente').toUpperCase()}
                    </Text>
                  </View>

                  <Text style={[homeStyles.amountText, isIncome ? homeStyles.amountIncome : homeStyles.amountExpense]}>
                    {sign}${Number(item.amount || 0).toFixed(2)} USD
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={homeStyles.emptyText}>No se obtuvieron resultado.</Text>}
            stickySectionHeadersEnabled
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 320 }}
          />
        )}

        <View style={homeStyles.divider} />

        <Pressable style={homeStyles.registerSaleButton} onPress={openSaleModal}>
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

      <Modal transparent animationType="fade" visible={saleModalVisible} onRequestClose={closeSaleModal}>
        <View style={homeStyles.saleModalBackdrop}>
          <View style={homeStyles.saleModalCard}>
            <View style={homeStyles.saleModalHeader}>
              <Text style={homeStyles.saleModalTitle}>Registrar Venta</Text>
              <Pressable onPress={closeSaleModal}>
                <Feather name="x" size={28} color="#2a2f3d" />
              </Pressable>
            </View>

            <Pressable style={homeStyles.clientSelect} onPress={() => setClientSelectorVisible(true)}>
              <Text style={homeStyles.clientSelectText} numberOfLines={1}>
                {selectedClientName}
              </Text>
            </Pressable>

            <Text style={homeStyles.fieldLabel}>Cantidad *</Text>
            <TextInput
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="Ingrese la cantidad de venta"
              style={homeStyles.modalInput}
              keyboardType="decimal-pad"
              placeholderTextColor="#8a92a1"
            />

            <Text style={homeStyles.fieldLabel}>Foto (opcional)</Text>
            <Pressable style={homeStyles.fileButton} onPress={pickImage}>
              <Text style={homeStyles.fileButtonText}>Seleccionar archivo</Text>
            </Pressable>
            {imageAsset?.uri ? (
              <View style={homeStyles.imagePreviewWrap}>
                <Image source={{ uri: imageAsset.uri }} style={homeStyles.imagePreview} resizeMode="cover" />
                <Pressable style={homeStyles.removeImageBtn} onPress={() => setImageAsset(null)}>
                  <Feather name="x" size={12} color="#ffffff" />
                </Pressable>
              </View>
            ) : (
              <Text style={homeStyles.smallText}>Sin archivos seleccionados</Text>
            )}

            <Text style={homeStyles.fieldLabel}>Notas (opcional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Escribe una nota (opcional)"
              style={[homeStyles.modalInput, homeStyles.notesInput]}
              placeholderTextColor="#8a92a1"
              multiline
            />

            <Text style={homeStyles.fieldLabel}>Fecha</Text>
            <View style={homeStyles.dateDisplayWrap}>
              <Text style={homeStyles.dateDisplayText}>{saleDateDisplay}</Text>
            </View>

            {saleMessage.length > 0 && <Text style={homeStyles.saleErrorText}>{saleMessage}</Text>}

            <View style={homeStyles.modalActionsRow}>
              <Pressable
                style={[homeStyles.modalActionBtn, homeStyles.modalConfirmBtn, saleLoading && { opacity: 0.6 }]}
                onPress={handleConfirmSale}
                disabled={saleLoading || clientsLoading}
              >
                <Text style={homeStyles.modalActionBtnText}>{saleLoading ? 'Guardando...' : 'Confirmar'}</Text>
              </Pressable>
              <Pressable style={[homeStyles.modalActionBtn, homeStyles.modalCancelBtn]} onPress={closeSaleModal}>
                <Text style={homeStyles.modalCancelBtnText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={clientSelectorVisible}
        onRequestClose={() => setClientSelectorVisible(false)}
      >
        <View style={homeStyles.saleModalBackdrop}>
          <View style={homeStyles.clientListCard}>
            <Text style={homeStyles.clientListTitle}>Selecciona un emprendedor</Text>

            <TextInput
              value={clientSearch}
              onChangeText={setClientSearch}
              placeholder="Buscar emprendedor..."
              style={homeStyles.clientSearchInput}
              placeholderTextColor="#8a92a1"
            />

            {clientsLoading ? (
              <Text style={homeStyles.smallText}>Cargando emprendedores...</Text>
            ) : (
              <ScrollView style={{ maxHeight: 280 }}>
                {filteredClients.map((item) => (
                  <Pressable
                    key={item.id}
                    style={homeStyles.clientRow}
                    onPress={() => {
                      setSelectedClientId(item.id);
                      setSelectedClientName(item.name);
                      setClientSearch('');
                      setClientSelectorVisible(false);
                    }}
                  >
                    <Text style={homeStyles.clientRowText}>{item.name}</Text>
                  </Pressable>
                ))}
                {!filteredClients.length && (
                  <Text style={homeStyles.smallText}>No se encontraron emprendedores.</Text>
                )}
              </ScrollView>
            )}

            <Pressable style={[homeStyles.modalActionBtn, homeStyles.modalCancelBtn]} onPress={() => setClientSelectorVisible(false)}>
              <Text style={homeStyles.modalCancelBtnText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
