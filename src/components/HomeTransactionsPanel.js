import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Swipeable } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  addTransaction,
  getClientsList,
  getTransactionsByDateRange,
  updateTransaction,
  deleteTransaction,
} from '../services/transactionsService';
import { getCachedSession } from '../services/sessionService';
import { homeStyles } from '../theme/homeStyles';

const EL_SALVADOR_TZ = 'America/El_Salvador';
const API_BASE_URL = 'https://apivitrinovapp.clobitech.com';

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

export function HomeTransactionsPanel({ onSessionExpired, onGoAllTransactions, onGoNotificationReports, onGoTransactionReports }) {
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

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editImageAsset, setEditImageAsset] = useState(null);
  const [editImagePreviewUri, setEditImagePreviewUri] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [imageZoomVisible, setImageZoomVisible] = useState(false);
  const swipeableRefs = useRef({});

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

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
      } catch (_requestError) {
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
    } catch (_e) {
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
    } catch (_errorPick) {
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
    } catch (_e) {
      setSaleMessage('No fue posible registrar la transacción.');
    } finally {
      setSaleLoading(false);
    }
  };

  const getTransactionImageUri = (imagePath = '') => {
    if (!imagePath) {
      return '';
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const normalized = imagePath.replace(/^\/+/, '');

    if (normalized.startsWith('uploads/')) {
      return `${API_BASE_URL}/static/${normalized}`;
    }

    return `${API_BASE_URL}/static/uploads/${normalized}`;
  };

  const closeAllSwipeables = () => {
    Object.values(swipeableRefs.current).forEach((ref) => ref?.close?.());
  };

  const closeEditModal = () => {
    closeAllSwipeables();
    setEditModalVisible(false);
    setEditingTransaction(null);
    setEditAmount('');
    setEditNotes('');
    setEditImageAsset(null);
    setEditImagePreviewUri('');
    setEditMessage('');
    setImageZoomVisible(false);
  };

  const openEditModal = (item) => {
    setEditingTransaction(item);
    setEditAmount(Number(item?.amount || 0).toFixed(2));
    setEditNotes(item?.notes || '');
    setEditImageAsset(null);
    setEditImagePreviewUri(getTransactionImageUri(item?.image_path || ''));
    setEditMessage('');
    setEditModalVisible(true);
  };

  const handleEditAmountChange = (value) => {
    const normalized = value.replace(',', '.');
    if (/^\d*(\.\d{0,2})?$/.test(normalized)) {
      setEditAmount(normalized);
    }
  };

  const pickEditImage = async () => {
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

      const localImage = {
        ...original,
        uri: manipulated.uri,
        mimeType: 'image/jpeg',
        fileName: original.fileName || `sale_${Date.now()}.jpg`,
      };

      setEditImageAsset(localImage);
      setEditImagePreviewUri(localImage.uri);
    } catch (_errorPick) {
      setEditMessage('No fue posible seleccionar la imagen.');
    }
  };

  const handleUpdateTransaction = async () => {
    const session = getCachedSession();

    if (!session?.token) {
      closeEditModal();
      onSessionExpired();
      return;
    }

    if (!editingTransaction?.id) {
      setEditMessage('No se encontró la transacción a editar.');
      return;
    }

    if (!editAmount || Number(editAmount) <= 0) {
      setEditMessage('Ingresa una cantidad válida.');
      return;
    }

    try {
      setEditLoading(true);
      setEditMessage('');

      const result = await updateTransaction({
        token: session.token,
        transactionId: editingTransaction.id,
        amount: Number(editAmount).toFixed(2),
        notes: editNotes,
        image: editImageAsset,
      });

      if (result.tokenExpired) {
        closeEditModal();
        onSessionExpired();
        return;
      }

      if (!result.ok) {
        setEditMessage(result.message || 'No fue posible actualizar la transacción.');
        return;
      }

      closeEditModal();
      setRefreshTick((prev) => prev + 1);
    } catch (_e) {
      setEditMessage('No fue posible actualizar la transacción.');
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteModal = (item) => {
    setDeletingTransaction(item);
    setDeleteMessage('');
    setDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    closeAllSwipeables();
    setDeleteModalVisible(false);
    setDeletingTransaction(null);
    setDeleteMessage('');
  };

  const handleDeleteTransaction = async () => {
    const session = getCachedSession();

    if (!session?.token) {
      closeDeleteModal();
      onSessionExpired();
      return;
    }

    if (!deletingTransaction?.id) {
      setDeleteMessage('No se encontró la transacción a eliminar.');
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteMessage('');

      const result = await deleteTransaction({
        token: session.token,
        transactionId: deletingTransaction.id,
      });

      if (result.tokenExpired) {
        closeDeleteModal();
        onSessionExpired();
        return;
      }

      if (!result.ok) {
        setDeleteMessage(result.message || 'No fue posible eliminar la transacción.');
        return;
      }

      closeDeleteModal();
      setRefreshTick((prev) => prev + 1);
    } catch (_e) {
      setDeleteMessage('No fue posible eliminar la transacción.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSwipeOpen = (direction, item) => {
    const ref = swipeableRefs.current[item.id];

    ref?.close?.();

    if (direction === 'left') {
      openDeleteModal(item);
      return;
    }

    if (direction === 'right') {
      openEditModal(item);
    }
  };

  const renderRightActions = () => <View style={homeStyles.swipeGhostAction} />;
  const renderLeftActions = () => <View style={homeStyles.swipeGhostAction} />;

  const handleGoNotificationReports = () => {
    if (typeof onGoNotificationReports === 'function') {
      onGoNotificationReports();
    }
  };

  const handleGoTransactionReports = () => {
    if (typeof onGoTransactionReports === 'function') {
      onGoTransactionReports();
    }
  };

  return (
    <>
      <View style={homeStyles.content}>
        <View style={homeStyles.salesCard}>
          <Text style={homeStyles.salesTitle}>Total de Ventas</Text>
          <Text style={homeStyles.salesValue}>${Number(sales || 0).toFixed(2)}</Text>
        </View>

        <View style={homeStyles.sectionHeader}>
          <Text style={homeStyles.sectionTitle}>Transacciones</Text>
          <Pressable onPress={onGoAllTransactions}>
            <Text style={homeStyles.sectionLink}>Ver todo →</Text>
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
                <Text style={homeStyles.dateTitle}>📅 {title}</Text>
              </View>
            )}
            renderItem={({ item }) => {
              const isIncome = item.transaction_type === 'income';
              const sign = isIncome ? '+' : '-';

              return (
                <Swipeable
                  ref={(ref) => {
                    if (ref) {
                      swipeableRefs.current[item.id] = ref;
                    }
                  }}
                  renderLeftActions={renderLeftActions}
                  renderRightActions={renderRightActions}
                  overshootLeft={false}
                  overshootRight={false}
                  leftThreshold={30}
                  rightThreshold={30}
                  onSwipeableOpen={(direction) => handleSwipeOpen(direction, item)}
                >
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

                    <View style={homeStyles.amountPill}>
                      <Text style={[homeStyles.amountText, isIncome ? homeStyles.amountIncome : homeStyles.amountExpense]}>
                        {sign}${Number(item.amount || 0).toFixed(2)} USD
                      </Text>
                    </View>
                  </View>
                </Swipeable>
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
          <Text style={homeStyles.registerSaleText}>+ Registrar Venta</Text>
        </Pressable>

        <Pressable style={homeStyles.notificationReportButton} onPress={handleGoNotificationReports}>
          <Text style={homeStyles.notificationReportButtonText}>🔔 Reporte Notificaciones</Text>
        </Pressable>

        <Pressable style={homeStyles.transactionReportButton} onPress={handleGoTransactionReports}>
          <Text style={homeStyles.transactionReportButtonText}>📊 Reporte Transacciones</Text>
        </Pressable>
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

      <Modal transparent animationType="fade" visible={editModalVisible} onRequestClose={closeEditModal}>
        <View style={homeStyles.saleModalBackdrop}>
          <View style={homeStyles.saleModalCard}>
            <View style={homeStyles.saleModalHeader}>
              <Text style={homeStyles.saleModalTitle}>Editar Venta</Text>
              <Pressable onPress={closeEditModal}>
                <Feather name="x" size={28} color="#2a2f3d" />
              </Pressable>
            </View>

            <Text style={homeStyles.fieldLabel}>Emprendimiento</Text>
            <View style={homeStyles.readonlyField}>
              <Text style={homeStyles.readonlyFieldText} numberOfLines={1}>
                {(editingTransaction?.client_name || 'Cliente').toUpperCase()}
              </Text>
            </View>

            <Text style={homeStyles.fieldLabel}>Cantidad *</Text>
            <TextInput
              value={editAmount}
              onChangeText={handleEditAmountChange}
              placeholder="Ingrese la cantidad de venta"
              style={homeStyles.modalInput}
              keyboardType="decimal-pad"
              placeholderTextColor="#8a92a1"
            />

            <Text style={homeStyles.fieldLabel}>Foto (opcional)</Text>
            <Pressable style={homeStyles.fileButton} onPress={pickEditImage}>
              <Text style={homeStyles.fileButtonText}>Seleccionar archivo</Text>
            </Pressable>
            {editImagePreviewUri ? (
              <View style={homeStyles.imagePreviewWrap}>
                <Pressable onPress={() => setImageZoomVisible(true)}>
                  <Image source={{ uri: editImagePreviewUri }} style={homeStyles.imagePreview} resizeMode="cover" />
                </Pressable>
                <Pressable
                  style={homeStyles.removeImageBtn}
                  onPress={() => {
                    setEditImagePreviewUri('');
                    setEditImageAsset(null);
                    setImageZoomVisible(false);
                  }}
                >
                  <Feather name="x" size={12} color="#ffffff" />
                </Pressable>
              </View>
            ) : (
              <Text style={homeStyles.smallText}>Sin archivos seleccionados</Text>
            )}

            <Text style={homeStyles.fieldLabel}>Notas (opcional)</Text>
            <TextInput
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Escribe una nota (opcional)"
              style={[homeStyles.modalInput, homeStyles.notesInput]}
              placeholderTextColor="#8a92a1"
              multiline
            />

            {editMessage.length > 0 && <Text style={homeStyles.saleErrorText}>{editMessage}</Text>}

            <View style={homeStyles.modalActionsRow}>
              <Pressable
                style={[homeStyles.modalActionBtn, homeStyles.modalConfirmBtn, editLoading && { opacity: 0.6 }]}
                onPress={handleUpdateTransaction}
                disabled={editLoading}
              >
                <Text style={homeStyles.modalActionBtnText}>{editLoading ? 'Guardando...' : 'Actualizar'}</Text>
              </Pressable>
              <Pressable style={[homeStyles.modalActionBtn, homeStyles.modalCancelBtn]} onPress={closeEditModal}>
                <Text style={homeStyles.modalCancelBtnText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={deleteModalVisible} onRequestClose={closeDeleteModal}>
        <View style={homeStyles.saleModalBackdrop}>
          <View style={homeStyles.deleteModalCard}>
            <View style={homeStyles.saleModalHeader}>
              <Text style={homeStyles.deleteModalTitle}>Eliminar Transacción</Text>
              <Pressable onPress={closeDeleteModal}>
                <Feather name="x" size={28} color="#2a2f3d" />
              </Pressable>
            </View>

            <Text style={homeStyles.deleteModalMessage}>
              ¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer.
            </Text>

            {deleteMessage.length > 0 && <Text style={homeStyles.saleErrorText}>{deleteMessage}</Text>}

            <View style={homeStyles.deleteActionsRow}>
              <Pressable style={[homeStyles.deleteBtn, homeStyles.deleteCancelBtn]} onPress={closeDeleteModal}>
                <Text style={homeStyles.deleteCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[homeStyles.deleteBtn, homeStyles.deleteConfirmBtn, deleteLoading && { opacity: 0.6 }]}
                onPress={handleDeleteTransaction}
                disabled={deleteLoading}
              >
                <Text style={homeStyles.deleteConfirmText}>{deleteLoading ? 'Eliminando...' : 'Eliminar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={imageZoomVisible} onRequestClose={() => setImageZoomVisible(false)}>
        <View style={homeStyles.imageZoomBackdrop}>
          <View style={homeStyles.imageZoomHeader}>
            <Pressable style={homeStyles.imageZoomCloseBtn} onPress={() => setImageZoomVisible(false)}>
              <Feather name="x" size={28} color="#ffffff" />
            </Pressable>
          </View>
          <Image source={{ uri: editImagePreviewUri }} style={homeStyles.imageZoomImage} resizeMode="contain" />
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
              <ScrollView style={{ maxHeight: 280 }} keyboardShouldPersistTaps="always">
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

            <Pressable
              style={[homeStyles.modalActionBtn, homeStyles.modalCancelBtn]}
              onPress={() => setClientSelectorVisible(false)}
            >
              <Text style={homeStyles.modalCancelBtnText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
