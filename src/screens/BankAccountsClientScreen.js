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

const ACCOUNT_TYPES = ['Cuenta Ahorro', 'Cuenta Corriente', 'Cuenta Empresarial', 'Cuenta Digital'];
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

const getInitials = (name = '') => name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'EM';

export function BankAccountsClientScreen({ client, onGoBack, onSessionExpired, onLogout }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [editVisible, setEditVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [editAccountHolder, setEditAccountHolder] = useState('');
  const [editAccountType, setEditAccountType] = useState('Cuenta Ahorro');
  const [editBankName, setEditBankName] = useState('');
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
    if (!term) return accounts;

    return accounts.filter((account) => {
      const holder = (account?.name_client || '').toLowerCase();
      const bank = (account?.name_bank || '').toLowerCase();
      return holder.includes(term) || bank.includes(term);
    });
  }, [accounts, search]);

  const filteredBanks = useMemo(() => {
    const term = bankSearch.trim().toLowerCase();
    if (!term) return BANK_OPTIONS;
    return BANK_OPTIONS.filter((bank) => bank.toLowerCase().includes(term));
  }, [bankSearch]);

  const openEditModal = (account) => {
    setSelectedAccount(account);
    setEditAccountHolder((account?.name_client || '').trim());
    setEditAccountType(account?.type_account || 'Cuenta Ahorro');
    setEditBankName(account?.name_bank || '');
    setEditBankOpen(false);
    setBankSearch('');
    setFormError('');
    setEditVisible(true);
  };

  const closeEditModal = () => {
    setEditVisible(false);
    setSelectedAccount(null);
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

    const number = (selectedAccount?.num_account || '').trim();
    const holder = editAccountHolder.trim();

    if (!/^\d+$/.test(number)) {
      setFormError('Número de cuenta no válido.');
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
    } catch (_e) {
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
    } catch (_e) {
      setFormError('No fue posible eliminar la cuenta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBox}><Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="cover" /></View>
        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="log-out" size={15} color="#fff" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.titleOverline}>Detalle</Text>
            <Text style={styles.title}>Cuentas Bancarias</Text>
          </View>
          <Pressable style={styles.backBtn} onPress={onGoBack}>
            <View style={styles.backDot}><Feather name="arrow-left" size={14} color="#fff" /></View>
            <Text style={styles.backBtnText}>Regresar</Text>
          </Pressable>
        </View>

        <View style={[styles.clientHeaderCard, { backgroundColor: client?.color || '#1A3F6F' }]}>
          <View style={styles.clientAvatar}><Text style={styles.clientAvatarText}>{getInitials(client?.name || '')}</Text></View>
          <Text style={styles.clientHeaderName} numberOfLines={1}>{client?.name || ''}</Text>
          <View style={styles.clientCountPill}><Text style={styles.clientCountText}>{filteredAccounts.length} cuentas</Text></View>
        </View>

        <View style={styles.searchWrap}>
          <Feather name="search" size={15} color="#8a92a1" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Filtrar por titular o banco" placeholderTextColor="#8a92a1" style={styles.searchInput} />
          {!!search && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#f59e0b" />
            <Text style={styles.emptyText}>Cargando cuentas...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAccounts}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={[styles.accountCard, { borderLeftColor: client?.color || '#F5A623' }]}>
                <View style={styles.accountTopRow}>
                  <View style={styles.accountAvatar}><Text style={styles.accountAvatarText}>{getInitials(item?.name_client || '')}</Text></View>
                  <View style={styles.accountBody}>
                    <Text style={styles.accountName} numberOfLines={1}>{(item?.name_client || '').toUpperCase()}</Text>
                    <Text style={styles.accountSub}>Cuenta bancaria</Text>
                  </View>
                  <Text style={styles.clientChevron}>›</Text>
                </View>

                <View style={styles.accountInfoWrap}>
                  <Text style={styles.accountInfoLine}><Text style={styles.accountInfoLabel}>NoCuenta: </Text>{item?.num_account || '-'}</Text>
                  <Text style={styles.accountInfoLine}><Text style={styles.accountInfoLabel}>Tipo: </Text>{item?.type_account || '-'}</Text>
                  <Text style={styles.accountInfoLine}><Text style={styles.accountInfoLabel}>Banco: </Text>{item?.name_bank || '-'}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable style={[styles.actionBtn, styles.editBtn]} onPress={() => openEditModal(item)}>
                    <Text style={styles.actionText}>✏️ Editar</Text>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => openDeleteModal(item)}>
                    <Text style={styles.actionText}>🗑️ Eliminar</Text>
                  </Pressable>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>{error || 'Sin cuentas para este emprendedor.'}</Text>}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Modal transparent animationType="fade" visible={editVisible} onRequestClose={closeEditModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalOverline}>Modificar</Text>
                <Text style={styles.modalTitle}>Editar Cuenta</Text>
              </View>
              <Pressable style={styles.modalCloseBtn} onPress={closeEditModal}><Feather name="x" size={20} color="#555" /></Pressable>
            </View>

            <Text style={styles.fieldLabel}>Número de Cuenta (no editable)</Text>
            <View style={styles.readOnlyCard}><Text style={styles.readOnlyText}>{selectedAccount?.num_account || ''}</Text></View>

            <Text style={styles.fieldLabel}>Titular Cuenta *</Text>
            <TextInput value={editAccountHolder} onChangeText={setEditAccountHolder} placeholder="Titular" placeholderTextColor="#8a92a1" style={styles.modalInput} />

            <Text style={styles.fieldLabel}>Tipo de Cuenta *</Text>
            <View style={styles.chipsWrap}>
              {ACCOUNT_TYPES.map((type) => (
                <Pressable key={type} style={[styles.typeChip, editAccountType === type && styles.typeChipActive]} onPress={() => setEditAccountType(type)}>
                  <Text style={[styles.typeChipText, editAccountType === type && styles.typeChipTextActive]}>{type}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Banco *</Text>
            <Pressable style={styles.selectorBtn} onPress={() => setEditBankOpen(true)}>
              <Text style={styles.selectorBtnText}>{editBankName || 'Seleccionar banco'}</Text>
            </Pressable>

            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalActionBtn, styles.modalConfirmBtn, saving && { opacity: 0.7 }]} onPress={handleUpdate} disabled={saving}>
                <Text style={styles.modalActionBtnText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
              </Pressable>
              <Pressable style={[styles.modalActionBtn, styles.modalCancelBtn]} onPress={closeEditModal}>
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={editBankOpen} onRequestClose={() => setEditBankOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Seleccionar Banco</Text>
              <Pressable style={styles.modalCloseBtn} onPress={() => setEditBankOpen(false)}><Feather name="x" size={18} color="#555" /></Pressable>
            </View>
            <View style={styles.searchWrap}>
              <Feather name="search" size={15} color="#8a92a1" />
              <TextInput value={bankSearch} onChangeText={setBankSearch} placeholder="Buscar banco" placeholderTextColor="#8a92a1" style={styles.searchInput} />
            </View>
            <ScrollView style={styles.sheetScroll}>
              {filteredBanks.map((bank) => (
                <Pressable key={bank} style={styles.sheetItem} onPress={() => { setEditBankName(bank); setEditBankOpen(false); }}>
                  <Text style={styles.sheetItemText}>{bank}</Text>
                  <Text style={styles.clientChevron}>›</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={deleteVisible} onRequestClose={closeDeleteModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.deleteModalCardModern}>
            <View style={styles.deleteIconWrap}><Text style={styles.deleteIconText}>🗑️</Text></View>
            <Text style={styles.deleteOverline}>Peligro</Text>
            <Text style={styles.deleteModalTitle}>Eliminar Cuenta</Text>
            <Text style={styles.deleteModalMessage}>¿Deseas eliminar esta cuenta bancaria? <Text style={styles.deleteModalStrong}>Esta acción no se puede deshacer.</Text></Text>
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            <View style={styles.deleteActionsRow}>
              <Pressable style={[styles.deleteBtnModal, saving && { opacity: 0.7 }]} onPress={handleDelete} disabled={saving}>
                <Text style={styles.deleteConfirmText}>{saving ? 'Eliminando...' : 'Eliminar'}</Text>
              </Pressable>
              <Pressable style={styles.deleteCancelBtn} onPress={closeDeleteModal}>
                <Text style={styles.deleteCancelText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
