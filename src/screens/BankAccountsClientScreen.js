import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  deleteBankAccount,
  getBankAccountsByClient,
  updateBankAccount,
} from '../services/transactionsService';
import { getCachedSession } from '../services/sessionService';
import { bankAccountsClientStyles as styles } from '../theme/bankAccountsClientStyles';

const logoUri =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrlgf2hRazz-UN3KEa32BKxj4T0C3RmJ0vCw&s';

const ACCOUNT_TYPES = ['Cuenta Ahorro', 'Cuenta Corriente'];
const BANK_OPTIONS = [
  'Banco Agricola',
  'Banco Davivienda',
  'Banco Industrial',
  'Banco de Fomento Agropecuario',
  'Banco Azul',
  'Banco Atlantida',
  'Banco Hipotecario',
  'Banco America Central',
  'Banco Izalqueño',
  'Banco Cuscatlan',
  'Fedecredito',
  'Banco Promerica',
  'Mi Banco',
  'Pay',
  'Bancovi R.L',
  'ABANK',
  'Comedica',
  'Credicomer',
  'Multimoney',
];

export function BankAccountsClientScreen({ client, onGoBack, onSessionExpired, onLogout }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [editVisible, setEditVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editAccountHolder, setEditAccountHolder] = useState('');
  const [editAccountType, setEditAccountType] = useState('Cuenta Ahorro');
  const [editBankName, setEditBankName] = useState('');
  const [editTypeOpen, setEditTypeOpen] = useState(false);
  const [editBankOpen, setEditBankOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [formError, setFormError] = useState('');

  const loadAccounts = useCallback(async () => {
    const session = getCachedSession();

    if (!session?.token) {
      onSessionExpired();
      return;
    }

    if (!client?.id) {
      setAccounts([]);
      setLoading(false);
      setError('Selecciona un emprendedor válido.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await getBankAccountsByClient({ token: session.token, clientId: client.id });

      if (result.tokenExpired) {
        onSessionExpired();
        return;
      }

      if (!result.ok) {
        setAccounts([]);
        setError(result.message || 'No se pudieron cargar las cuentas bancarias.');
        return;
      }

      setAccounts(Array.isArray(result.accounts) ? result.accounts : []);
    } catch (_error) {
      setAccounts([]);
      setError('No se pudieron cargar las cuentas bancarias.');
    } finally {
      setLoading(false);
    }
  }, [client?.id, onSessionExpired]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return accounts;
    }

    return accounts.filter((account) =>
      (account?.name_client || '').toLowerCase().includes(term),
    );
  }, [accounts, search]);

  const filteredBanks = useMemo(() => {
    const term = bankSearch.trim().toLowerCase();
    if (!term) {
      return BANK_OPTIONS;
    }

    return BANK_OPTIONS.filter((bank) => bank.toLowerCase().includes(term));
  }, [bankSearch]);

  const openEditModal = (account) => {
    setSelectedAccount(account);
    setEditAccountNumber((account?.num_account || '').trim());
    setEditAccountHolder((account?.name_client || '').trim());
    setEditAccountType(account?.type_account || 'Cuenta Ahorro');
    setEditBankName(account?.name_bank || '');
    setEditTypeOpen(false);
    setEditBankOpen(false);
    setBankSearch('');
    setFormError('');
    setEditVisible(true);
  };

  const closeEditModal = () => {
    setEditVisible(false);
    setSelectedAccount(null);
    setEditTypeOpen(false);
    setEditBankOpen(false);
    setBankSearch('');
    setFormError('');
  };

  const openDeleteModal = (account) => {
    setSelectedAccount(account);
    setDeleteVisible(true);
    setFormError('');
  };

  const closeDeleteModal = () => {
    setDeleteVisible(false);
    setSelectedAccount(null);
    setFormError('');
  };

  const handleUpdate = async () => {
    const session = getCachedSession();
    if (!session?.token) {
      closeEditModal();
      onSessionExpired();
      return;
    }

    if (!selectedAccount?.id) {
      setFormError('Cuenta no válida.');
      return;
    }

    const number = editAccountNumber.trim();
    const holder = editAccountHolder.trim();

    if (!/^\d+$/.test(number)) {
      setFormError('Número de cuenta: solo números.');
      return;
    }

    if (holder.length < 5) {
      setFormError('Titular de cuenta debe tener al menos 5 caracteres.');
      return;
    }

    if (!ACCOUNT_TYPES.includes(editAccountType)) {
      setFormError('Selecciona un tipo de cuenta válido.');
      return;
    }

    if (!BANK_OPTIONS.includes(editBankName)) {
      setFormError('Selecciona un banco válido.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      const result = await updateBankAccount({
        token: session.token,
        accountId: selectedAccount.id,
        numAccount: number,
        nameClient: holder,
        typeAccount: editAccountType,
        nameBank: editBankName,
      });

      if (result.tokenExpired) {
        closeEditModal();
        onSessionExpired();
        return;
      }

      if (!result.ok) {
        setFormError(result.message || 'No fue posible actualizar la cuenta.');
        return;
      }

      closeEditModal();
      await loadAccounts();
    } catch (_error) {
      setFormError('No fue posible actualizar la cuenta.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const session = getCachedSession();
    if (!session?.token) {
      closeDeleteModal();
      onSessionExpired();
      return;
    }

    if (!selectedAccount?.id) {
      setFormError('Cuenta no válida.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      const result = await deleteBankAccount({ token: session.token, accountId: selectedAccount.id });

      if (result.tokenExpired) {
        closeDeleteModal();
        onSessionExpired();
        return;
      }

      if (!result.ok) {
        setFormError(result.message || 'No fue posible eliminar la cuenta.');
        return;
      }

      closeDeleteModal();
      await loadAccounts();
    } catch (_error) {
      setFormError('No fue posible eliminar la cuenta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBox}><Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="cover" /></View>
        <Pressable style={styles.logoutButton} onPress={onLogout}><Text style={styles.logoutText}>Cerrar sesión</Text></Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.pageHeaderRow}>
          <Pressable style={styles.backBtn} onPress={onGoBack}>
            <Feather name="arrow-left" size={18} color="#3b2f7c" />
            <Text style={styles.backBtnText}>Regresar</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Cuentas Bancarias</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{(client?.name || 'EMPRENDEDOR').toUpperCase()}</Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Filtrar por titular"
          placeholderTextColor="#8a92a1"
          style={styles.searchInput}
        />

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#7c59d7" />
            <Text style={styles.emptyText}>Cargando cuentas...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAccounts}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>{error || 'Sin cuentas para este emprendedor.'}</Text>}
            renderItem={({ item }) => (
              <View style={styles.accountCard}>
                <Text style={styles.accountLine}><Text style={styles.accountLabel}>NoCuenta: </Text>{(item?.num_account || '').trim()}</Text>
                <Text style={styles.accountLine}><Text style={styles.accountLabel}>Titular: </Text>{(item?.name_client || '').trim()}</Text>
                <Text style={styles.accountLine}><Text style={styles.accountLabel}>TipoCuenta: </Text>{item?.type_account || '-'}</Text>
                <Text style={styles.accountLine}><Text style={styles.accountLabel}>Banco: </Text>{item?.name_bank || '-'}</Text>

                <View style={styles.actionsRow}>
                  <Pressable style={[styles.actionBtn, styles.editBtn]} onPress={() => openEditModal(item)}>
                    <Text style={styles.actionText}>Editar</Text>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => openDeleteModal(item)}>
                    <Text style={styles.actionText}>Eliminar</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <Modal transparent animationType="fade" visible={editVisible} onRequestClose={closeEditModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Cuenta</Text>
              <Pressable onPress={closeEditModal}><Feather name="x" size={24} color="#2a2f3d" /></Pressable>
            </View>

            <Text style={styles.fieldLabel}>Número de Cuenta *</Text>
            <TextInput
              value={editAccountNumber}
              onChangeText={(value) => setEditAccountNumber(value.replace(/[^0-9]/g, ''))}
              placeholder="Solo números"
              placeholderTextColor="#8a92a1"
              style={styles.modalInput}
              keyboardType="number-pad"
            />

            <Text style={styles.fieldLabel}>Titular Cuenta *</Text>
            <TextInput
              value={editAccountHolder}
              onChangeText={setEditAccountHolder}
              placeholder="Titular"
              placeholderTextColor="#8a92a1"
              style={styles.modalInput}
            />

            <Text style={styles.fieldLabel}>Tipo de Cuenta *</Text>
            <Pressable style={styles.pickerButton} onPress={() => setEditTypeOpen((prev) => !prev)}>
              <Text style={styles.pickerButtonText}>{editAccountType || 'Seleccionar tipo'}</Text>
            </Pressable>
            {editTypeOpen && (
              <View style={styles.pickerListInline}>
                {ACCOUNT_TYPES.map((type) => (
                  <Pressable key={type} style={styles.pickerItem} onPress={() => { setEditAccountType(type); setEditTypeOpen(false); }}>
                    <Text style={styles.pickerItemText}>{type}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={styles.fieldLabel}>Banco *</Text>
            <Pressable style={styles.pickerButton} onPress={() => setEditBankOpen(true)}>
              <Text style={styles.pickerButtonText}>{editBankName || 'Seleccionar banco'}</Text>
            </Pressable>

            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalActionBtn, styles.modalCancelBtn]} onPress={closeEditModal}>
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalActionBtn, styles.modalConfirmBtn, saving && { opacity: 0.7 }]} onPress={handleUpdate} disabled={saving}>
                <Text style={styles.modalActionBtnText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={editBankOpen} onRequestClose={() => setEditBankOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Banco</Text>
              <Pressable onPress={() => setEditBankOpen(false)}><Feather name="x" size={24} color="#2a2f3d" /></Pressable>
            </View>
            <TextInput
              value={bankSearch}
              onChangeText={setBankSearch}
              placeholder="Buscar banco"
              placeholderTextColor="#8a92a1"
              style={styles.bankSearchInput}
            />
            <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
              {filteredBanks.map((bank) => (
                <Pressable key={bank} style={styles.pickerItem} onPress={() => { setEditBankName(bank); setEditBankOpen(false); }}>
                  <Text style={styles.pickerItemText}>{bank}</Text>
                </Pressable>
              ))}
              {filteredBanks.length === 0 ? <Text style={styles.emptyText}>No se encontraron bancos.</Text> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={deleteVisible} onRequestClose={closeDeleteModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Eliminar Cuenta</Text>
              <Pressable onPress={closeDeleteModal}><Feather name="x" size={24} color="#2a2f3d" /></Pressable>
            </View>
            <Text style={styles.deleteMessage}>¿Deseas eliminar esta cuenta bancaria?</Text>
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalActionBtn, styles.modalCancelBtn]} onPress={closeDeleteModal}>
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalActionBtn, styles.deleteBtnModal, saving && { opacity: 0.7 }]} onPress={handleDelete} disabled={saving}>
                <Text style={styles.modalActionBtnText}>{saving ? 'Eliminando...' : 'Eliminar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
