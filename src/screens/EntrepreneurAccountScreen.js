import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import {
  deleteTransaction,
  exportTransactionsReport,
  getTransactionsByDateRange,
  updateTransaction,
} from '../services/transactionsService';
import { getCachedSession } from '../services/sessionService';
import { entrepreneurAccountStyles as styles } from '../theme/entrepreneurAccountStyles';

const API_BASE_URL = 'https://apivitrinovapp.clobitech.com';
const EL_SALVADOR_TZ = 'America/El_Salvador';

function formatDatePartsInElSalvador(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EL_SALVADOR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    year: map.year,
    month: map.month,
    day: map.day,
  };
}

function toApiDate(date) {
  const { year, month, day } = formatDatePartsInElSalvador(date);
  return `${year}-${month}-${day}`;
}

function toDisplayDate(date) {
  const { year, month, day } = formatDatePartsInElSalvador(date);
  return `${day}/${month}/${year}`;
}

function parseApiDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || '')) {
    return null;
  }

  return new Date(`${dateString}T00:00:00`);
}

function todayInElSalvador() {
  const now = new Date();
  const { year, month, day } = formatDatePartsInElSalvador(now);
  return new Date(`${year}-${month}-${day}T00:00:00`);
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

function getTransactionImageUri(imagePath = '') {
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
}

export function EntrepreneurAccountScreen({ entrepreneur, onGoHome, onSessionExpired }) {
  const today = useMemo(() => todayInElSalvador(), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [webStartDateInput, setWebStartDateInput] = useState(toApiDate(today));
  const [webEndDateInput, setWebEndDateInput] = useState(toApiDate(today));
  const [refreshTick, setRefreshTick] = useState(0);

  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState('0');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerField, setPickerField] = useState('start');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editImageAsset, setEditImageAsset] = useState(null);
  const [editImagePreviewUri, setEditImagePreviewUri] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [imageZoomVisible, setImageZoomVisible] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  const swipeableRefs = useRef({});

  useEffect(() => {
    if (!entrepreneur?.name) {
      return;
    }

    const session = getCachedSession();

    if (!session?.token) {
      onSessionExpired();
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');

        const result = await getTransactionsByDateRange({
          token: session.token,
          startDate: toApiDate(startDate),
          endDate: toApiDate(endDate),
          clientName: entrepreneur.name,
        });

        if (result.tokenExpired) {
          onSessionExpired();
          return;
        }

        if (!result.ok) {
          setRows([]);
          setSales('0');
          setError('No se obtuvieron resultado.');
          return;
        }

        setRows(result.transactions ?? []);
        setSales(result.summary?.ingresos ?? '0');
      } catch (_e) {
        setRows([]);
        setSales('0');
        setError('No se obtuvieron resultado.');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [endDate, entrepreneur, onSessionExpired, refreshTick, startDate]);

  const closeAllSwipeables = () => {
    Object.values(swipeableRefs.current).forEach((ref) => ref?.close?.());
  };


  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    setWebStartDateInput(toApiDate(startDate));
    setWebEndDateInput(toApiDate(endDate));
  }, [startDate, endDate]);

  const handleClear = () => {
    setStartDate(today);
    setEndDate(today);
    setWebStartDateInput(toApiDate(today));
    setWebEndDateInput(toApiDate(today));
  };


  const handleWebDateChange = (field, value) => {
    if (field === 'start') {
      setWebStartDateInput(value);
    } else {
      setWebEndDateInput(value);
    }

    const nextDate = parseApiDate(value);

    if (!nextDate) {
      return;
    }

    if (field === 'start') {
      setStartDate(nextDate);
      if (nextDate > endDate) {
        setEndDate(nextDate);
        setWebEndDateInput(value);
      }
      return;
    }

    setEndDate(nextDate);
    if (nextDate < startDate) {
      setStartDate(nextDate);
      setWebStartDateInput(value);
    }
  };

  const openDatePicker = (field) => {
    setPickerField(field);
    setPickerVisible(true);
  };

  const handleDateChange = (_event, selectedDate) => {
    if (Platform.OS !== 'ios') {
      setPickerVisible(false);
    }

    if (!selectedDate) {
      return;
    }

    if (pickerField === 'start') {
      setStartDate(selectedDate);
      if (selectedDate > endDate) {
        setEndDate(selectedDate);
      }
    } else {
      setEndDate(selectedDate);
      if (selectedDate < startDate) {
        setStartDate(selectedDate);
      }
    }
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


  const handleShareReport = async () => {
    const session = getCachedSession();

    if (!session?.token) {
      onSessionExpired();
      return;
    }

    try {
      setReportLoading(true);
      setError('');

      const startDateApi = toApiDate(startDate);
      const endDateApi = toApiDate(endDate);
      const clientName = entrepreneur?.name || '';
      const result = await exportTransactionsReport({
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
        setError(result.message || 'No fue posible generar el reporte.');
        return;
      }
      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        setError('No es posible compartir archivos en este dispositivo.');
        return;
      }

      await Sharing.shareAsync(result.fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Compartir reporte',
        UTI: 'org.openxmlformats.spreadsheetml.sheet',
      });

    } catch (_errorSharing) {
      setError('No fue posible compartir el reporte.');
    } finally {
      setReportLoading(false);
    }
  };

  const renderSwipeGhost = () => <View style={styles.swipeGhostAction} />;

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Pressable style={styles.topCloseButton} onPress={onGoHome}>
          <Feather name="x" size={24} color="#202536" />
        </Pressable>
      </View>

      <Text style={styles.title}>Resumen de la cuenta</Text>

      <View style={styles.nameCard}>
        <Text style={styles.nameCardText}>{entrepreneur?.name || ''}</Text>
      </View>

      <View style={styles.datesRow}>
        {Platform.OS === 'web' ? (
          <>
            <TextInput
              value={webStartDateInput}
              onChangeText={(value) => handleWebDateChange('start', value)}
              style={styles.webDateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#8a92a1"
              type="date"
            />
            <TextInput
              value={webEndDateInput}
              onChangeText={(value) => handleWebDateChange('end', value)}
              style={styles.webDateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#8a92a1"
              type="date"
            />
          </>
        ) : (
          <>
            <Pressable style={styles.dateInputButton} onPress={() => openDatePicker('start')}>
              <Text style={styles.dateInputButtonText}>{toDisplayDate(startDate)}</Text>
            </Pressable>
            <Pressable style={styles.dateInputButton} onPress={() => openDatePicker('end')}>
              <Text style={styles.dateInputButtonText}>{toDisplayDate(endDate)}</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.salesCard}>
        <Text style={styles.salesTitle}>Ventas</Text>
        <Text style={styles.salesValue}>{Number(sales || 0).toFixed(2)} USD</Text>
      </View>

      <View style={styles.reportRow}>
        <Pressable style={[styles.reportBtn, reportLoading && { opacity: 0.6 }]} onPress={handleShareReport} disabled={reportLoading}>
          <Text style={styles.reportBtnText}>{reportLoading ? 'Generando...' : 'Reportes'}</Text>
        </Pressable>
      </View>

      {error.length > 0 && rows.length > 0 && !loading && <Text style={styles.errorText}>{error}</Text>}

      {loading ? (
        <Text style={styles.emptyText}>Cargando transacciones...</Text>
      ) : rows.length === 0 ? (
        <Text style={styles.emptyText}>{error || 'No se obtuvieron resultado.'}</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
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
                renderLeftActions={renderSwipeGhost}
                renderRightActions={renderSwipeGhost}
                overshootLeft={false}
                overshootRight={false}
                leftThreshold={30}
                rightThreshold={30}
                onSwipeableOpen={(direction) => handleSwipeOpen(direction, item)}
              >
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(item.client_name)}</Text>
                  </View>

                  <View style={styles.body}>
                    <Text style={styles.titleText}>{isIncome ? 'Ventas' : 'Egreso'}</Text>
                    <Text style={styles.subtitleText}>{(item.client_name || 'Cliente').toUpperCase()}</Text>
                    <Text style={styles.dateText}>{formatTxnDate(item.transaction_date)}</Text>
                  </View>

                  <Text style={isIncome ? styles.amountIncome : styles.amountExpense}>
                    {sign}${Number(item.amount || 0).toFixed(2)} USD
                  </Text>
                </View>
              </Swipeable>
            );
          }}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.bottomActions}>
        <Pressable style={[styles.actionButton, styles.clearBtn]} onPress={handleClear}>
          <Text style={styles.actionText}>Limpiar Filtros</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.backBtn]} onPress={onGoHome}>
          <Text style={styles.actionText}>Regresar Home</Text>
        </Pressable>
      </View>

      <Modal transparent animationType="fade" visible={deleteModalVisible} onRequestClose={closeDeleteModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.deleteModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.deleteModalTitle}>Eliminar Transacción</Text>
              <Pressable onPress={closeDeleteModal}>
                <Feather name="x" size={28} color="#2a2f3d" />
              </Pressable>
            </View>

            <Text style={styles.deleteModalMessage}>
              ¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer.
            </Text>

            {deleteMessage.length > 0 && <Text style={styles.errorText}>{deleteMessage}</Text>}

            <View style={styles.deleteActionsRow}>
              <Pressable style={[styles.deleteBtn, styles.deleteCancelBtn]} onPress={closeDeleteModal}>
                <Text style={styles.deleteCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.deleteBtn, styles.deleteConfirmBtn, deleteLoading && { opacity: 0.6 }]}
                onPress={handleDeleteTransaction}
                disabled={deleteLoading}
              >
                <Text style={styles.deleteConfirmText}>{deleteLoading ? 'Eliminando...' : 'Eliminar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={editModalVisible} onRequestClose={closeEditModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Venta</Text>
              <Pressable onPress={closeEditModal}>
                <Feather name="x" size={28} color="#2a2f3d" />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Cantidad *</Text>
            <TextInput
              value={editAmount}
              onChangeText={handleEditAmountChange}
              placeholder="Ingrese la cantidad de venta"
              style={styles.modalInput}
              keyboardType="decimal-pad"
              placeholderTextColor="#8a92a1"
            />

            <Text style={styles.fieldLabel}>Foto (opcional)</Text>
            <Pressable style={styles.fileButton} onPress={pickEditImage}>
              <Text style={styles.fileButtonText}>Seleccionar archivo</Text>
            </Pressable>
            {editImagePreviewUri ? (
              <View style={styles.imagePreviewWrap}>
                <Pressable onPress={() => setImageZoomVisible(true)}>
                  <Image source={{ uri: editImagePreviewUri }} style={styles.imagePreview} resizeMode="cover" />
                </Pressable>
                <Pressable
                  style={styles.removeImageBtn}
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
              <Text style={styles.smallText}>Sin archivos seleccionados</Text>
            )}

            <Text style={styles.fieldLabel}>Notas (opcional)</Text>
            <TextInput
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Escribe una nota (opcional)"
              style={[styles.modalInput, styles.notesInput]}
              placeholderTextColor="#8a92a1"
              multiline
            />

            {editMessage.length > 0 && <Text style={styles.errorText}>{editMessage}</Text>}

            <View style={styles.modalActionsRow}>
              <Pressable
                style={[styles.modalActionBtn, styles.modalConfirmBtn, editLoading && { opacity: 0.6 }]}
                onPress={handleUpdateTransaction}
                disabled={editLoading}
              >
                <Text style={styles.modalActionBtnText}>{editLoading ? 'Guardando...' : 'Actualizar'}</Text>
              </Pressable>
              <Pressable style={[styles.modalActionBtn, styles.modalCancelBtn]} onPress={closeEditModal}>
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={imageZoomVisible} onRequestClose={() => setImageZoomVisible(false)}>
        <View style={styles.imageZoomBackdrop}>
          <View style={styles.imageZoomHeader}>
            <Pressable style={styles.imageZoomCloseBtn} onPress={() => setImageZoomVisible(false)}>
              <Feather name="x" size={28} color="#ffffff" />
            </Pressable>
          </View>
          <Image source={{ uri: editImagePreviewUri }} style={styles.imageZoomImage} resizeMode="contain" />
        </View>
      </Modal>

      {pickerVisible && (
        <DateTimePicker
          value={pickerField === 'start' ? startDate : endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}
