import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  addBankAccount,
  deleteBankAccount,
  getBankAccountsByClient,
  getClientsList,
  updateBankAccount,
} from '../services/transactionsService';
import { getCachedSession } from '../services/sessionService';
import { bankAccountsStyles as styles } from '../theme/bankAccountsStyles';

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

function accountValueOnlyNumbers(value) {
  return value.replace(/[^0-9]/g, '');
}

export function BankAccountsScreen({ onGoHome, onGoEntrepreneurs, onSessionExpired, onLogout }) {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [error, setError] = useState('');

  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountsError, setAccountsError] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountType, setAccountType] = useState('Cuenta Ahorro');
  const [bankName, setBankName] = useState('');

  const [pickerTypeOpen, setPickerTypeOpen] = useState(false);
  const [pickerBankOpen, setPickerBankOpen] = useState(false);
  const [pickerClientOpen, setPickerClientOpen] = useState(false);
  const [pickerBankTarget, setPickerBankTarget] = useState('add');

  const [clientSearch, setClientSearch] = useState('');
  const [bankSearch, setBankSearch] = useState('');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editNumber, setEditNumber] = useState('');
  const [editHolder, setEditHolder] = useState('');
  const [editType, setEditType] = useState('Cuenta Ahorro');
  const [editBank, setEditBank] = useState('');
  const [editTypeOpen, setEditTypeOpen] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      const session = getCachedSession();
      if (!session?.token) {
        onSessionExpired();
        return;
      }

      try {
        setLoadingClients(true);
        setError('');
        const result = await getClientsList({ token: session.token });
        if (result.tokenExpired) {
          onSessionExpired();
          return;
        }
        if (!result.ok) {
          setClients([]);
          setError(result.message || 'No se obtuvieron resultado.');
          return;
        }
        setClients(result.clients || []);
      } catch (_e) {
        setError('No se obtuvieron resultado.');
      } finally {
        setLoadingClients(false);
      }
    };

    run();
  }, [onSessionExpired]);

  useEffect(() => {
    const fetchAccounts = async () => {
      const session = getCachedSession();
      if (!session?.token) {
        onSessionExpired();
        return;
      }

      if (!selectedClient?.id) {
        setAccounts([]);
        setAccountsError('');
        return;
      }

      try {
        setLoadingAccounts(true);
        setAccountsError('');
        const result = await getBankAccountsByClient({ token: session.token, clientId: selectedClient.id });

        if (result.tokenExpired) {
          onSessionExpired();
          return;
        }

        if (!result.ok) {
          setAccounts([]);
          setAccountsError(result.message || 'No se obtuvieron cuentas bancarias.');
          return;
        }

        setAccounts(result.accounts || []);
      } catch (_e) {
        setAccounts([]);
        setAccountsError('No se obtuvieron cuentas bancarias.');
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [onSessionExpired, selectedClient]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) => (c?.name || '').toLowerCase().includes(term));
  }, [clients, search]);

  const filteredClientsForPicker = useMemo(() => {
    const term = clientSearch.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) => (c?.name || '').toLowerCase().includes(term));
  }, [clients, clientSearch]);

  const filteredBanks = useMemo(() => {
    const term = bankSearch.trim().toLowerCase();
    if (!term) return BANK_OPTIONS;
    return BANK_OPTIONS.filter((b) => b.toLowerCase().includes(term));
  }, [bankSearch]);

  const resetAddForm = () => {
    setAccountNumber('');
    setAccountHolder('');
    setAccountType('Cuenta Ahorro');
    setBankName('');
    setPickerTypeOpen(false);
    setBankSearch('');
    setFormError('');
  };

  const closeAddModal = () => {
    setModalVisible(false);
    resetAddForm();
  };

  const validateForm = ({ num, holder, type, bank }) => {
    if (!selectedClient?.id) return 'Selecciona un emprendedor del listado.';
    if (!/^\d+$/.test(num)) return 'Número de cuenta: solo números.';
    if (holder.length < 5) return 'Titular de cuenta debe tener al menos 5 caracteres.';
    if (!ACCOUNT_TYPES.includes(type)) return 'Selecciona un tipo de cuenta válido.';
    if (!BANK_OPTIONS.includes(bank)) return 'Selecciona un banco válido.';
    return '';
  };

  const handleSave = async () => {
    const session = getCachedSession();
    if (!session?.token) {
      closeAddModal();
      onSessionExpired();
      return;
    }

    const num = accountNumber.trim();
    const holder = accountHolder.trim();
    const validationError = validateForm({ num, holder, type: accountType, bank: bankName });

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      const result = await addBankAccount({
        token: session.token,
        idCliente: selectedClient.id,
        nameBank: bankName,
        nameClient: holder,
        numAccount: num,
        typeAccount: accountType,
      });

      if (result.tokenExpired) {
        closeAddModal();
        onSessionExpired();
        return;
      }

      if (!result.ok) {
        setFormError(result.message || 'No fue posible agregar la cuenta bancaria.');
        return;
      }

      closeAddModal();
      const reload = await getBankAccountsByClient({ token: session.token, clientId: selectedClient.id });
      if (reload.ok) {
        setAccounts(reload.accounts || []);
      }
    } catch (_e) {
      setFormError('No fue posible agregar la cuenta bancaria.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setEditNumber(String(account?.num_account || '').trim());
    setEditHolder(String(account?.name_client || '').trim());
    setEditType(account?.type_account || 'Cuenta Ahorro');
    setEditBank(account?.name_bank || '');
    setEditTypeOpen(false);
    setEditError('');
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingAccount(null);
    setEditNumber('');
    setEditHolder('');
    setEditType('Cuenta Ahorro');
    setEditBank('');
    setEditTypeOpen(false);
    setEditError('');
  };

  const handleUpdate = async () => {
    const session = getCachedSession();
    if (!session?.token) {
      closeEditModal();
      onSessionExpired();
      return;
    }

    if (!editingAccount?.id) {
      setEditError('No se encontró la cuenta bancaria.');
      return;
    }

    const num = editNumber.trim();
    const holder = editHolder.trim();
    const validationError = validateForm({ num, holder, type: editType, bank: editBank });
    if (validationError) {
      setEditError(validationError);
      return;
    }

    try {
      setEditSaving(true);
      setEditError('');
      const result = await updateBankAccount({
        token: session.token,
        accountId: editingAccount.id,
        numAccount: num,
        nameClient: holder,
        typeAccount: editType,
        nameBank: editBank,
      });

      if (result.tokenExpired) {
        closeEditModal();
        onSessionExpired();
        return;
      }

      if (!result.ok) {
        setEditError(result.message || 'No fue posible actualizar la cuenta bancaria.');
        return;
      }

      closeEditModal();
      const reload = await getBankAccountsByClient({ token: session.token, clientId: selectedClient.id });
      if (reload.ok) {
        setAccounts(reload.accounts || []);
      }
    } catch (_e) {
      setEditError('No fue posible actualizar la cuenta bancaria.');
    } finally {
      setEditSaving(false);
    }
  };

  const openDeleteModal = (account) => {
    setDeletingAccount(account);
    setDeleteError('');
    setDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalVisible(false);
    setDeletingAccount(null);
    setDeleteError('');
  };

  const handleDelete = async () => {
    const session = getCachedSession();
    if (!session?.token) {
      closeDeleteModal();
      onSessionExpired();
      return;
    }

    if (!deletingAccount?.id) {
      setDeleteError('No se encontró la cuenta bancaria.');
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError('');
      const result = await deleteBankAccount({ token: session.token, accountId: deletingAccount.id });

      if (result.tokenExpired) {
        closeDeleteModal();
        onSessionExpired();
        return;
      }

      if (!result.ok) {
        setDeleteError(result.message || 'No fue posible eliminar la cuenta bancaria.');
        return;
      }

      closeDeleteModal();
      setAccounts((prev) => prev.filter((item) => item.id !== deletingAccount.id));
    } catch (_e) {
      setDeleteError('No fue posible eliminar la cuenta bancaria.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBox}><Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="cover" /></View>
        <Pressable style={styles.logoutButton} onPress={onLogout}><Text style={styles.logoutText}>Cerrar sesión</Text></Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Cuentas Bancarias</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar emprendedor"
          placeholderTextColor="#8a92a1"
          style={styles.searchInput}
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          {loadingClients ? (
            <Text style={styles.emptyText}>Cargando emprendedores...</Text>
          ) : (
            <>
              {filteredClients.map((item) => {
                const selected = selectedClient?.id === item.id;
                return (
                  <Pressable
                    key={String(item.id)}
                    style={[styles.clientCard, selected && styles.clientCardSelected]}
                    onPress={() => setSelectedClient(item)}
                  >
                    <View style={styles.clientIconWrap}><Feather name="users" size={20} color="#1f2433" /></View>
                    <View style={styles.clientBody}>
                      <Text style={styles.clientName} numberOfLines={1}>{(item?.name || 'EMPRENDEDOR').toUpperCase()}</Text>
                      <Text style={styles.clientSubtitle}>{selected ? 'Seleccionado' : 'Emprendedor'}</Text>
                    </View>
                  </Pressable>
                );
              })}

              {filteredClients.length === 0 && <Text style={styles.emptyText}>{error || 'No se encontraron emprendedores.'}</Text>}
            </>
          )}

          <Pressable style={styles.primaryButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.primaryButtonText}>Cuenta Bancaria</Text>
          </Pressable>

          <Text style={styles.accountsTitle}>
            {selectedClient?.name ? `Cuentas de ${selectedClient.name}` : 'Selecciona un emprendedor para ver cuentas'}
          </Text>

          {loadingAccounts ? (
            <Text style={styles.emptyText}>Cargando cuentas bancarias...</Text>
          ) : selectedClient?.id ? (
            accounts.length > 0 ? (
              accounts.map((account) => (
                <View key={String(account.id)} style={styles.accountCard}>
                  <Text style={styles.accountLine}><Text style={styles.accountLabel}>NoCuenta:</Text> {String(account.num_account || '').trim()}</Text>
                  <Text style={styles.accountLine}><Text style={styles.accountLabel}>Titular:</Text> {String(account.name_client || '').trim()}</Text>
                  <Text style={styles.accountLine}><Text style={styles.accountLabel}>TipoCuenta:</Text> {account.type_account || ''}</Text>
                  <Text style={styles.accountLine}><Text style={styles.accountLabel}>Banco:</Text> {account.name_bank || ''}</Text>

                  <View style={styles.accountActionsRow}>
                    <Pressable style={[styles.smallBtn, styles.editBtn]} onPress={() => openEditModal(account)}>
                      <Text style={styles.smallBtnText}>Editar</Text>
                    </Pressable>
                    <Pressable style={[styles.smallBtn, styles.deleteBtn]} onPress={() => openDeleteModal(account)}>
                      <Text style={styles.smallBtnText}>Eliminar</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{accountsError || 'No hay cuentas bancarias asignadas.'}</Text>
            )
          ) : null}
        </ScrollView>
      </View>

      <View style={styles.bottomBar}>
        <Pressable style={styles.bottomIconWrap} onPress={onGoHome}><Feather name="home" size={24} color="#7c59d7" /></Pressable>
        <Pressable style={styles.bottomIconWrap} onPress={onGoEntrepreneurs}><Feather name="users" size={24} color="#7c59d7" /></Pressable>
        <View style={styles.bottomIconWrapActive}><Feather name="credit-card" size={24} color="#ffffff" /></View>
      </View>

      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={closeAddModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Cuenta Bancaria</Text>
              <Pressable onPress={closeAddModal}><Feather name="x" size={24} color="#2a2f3d" /></Pressable>
            </View>

            <Text style={styles.fieldLabel}>Emprendedor *</Text>
            <Pressable style={styles.pickerButton} onPress={() => setPickerClientOpen(true)}>
              <Text style={styles.pickerButtonText}>{(selectedClient?.name || 'Seleccionar emprendedor').toUpperCase()}</Text>
            </Pressable>

            <Text style={styles.fieldLabel}>Número de Cuenta *</Text>
            <TextInput value={accountNumber} onChangeText={(v) => setAccountNumber(accountValueOnlyNumbers(v))} placeholder="Solo números" placeholderTextColor="#8a92a1" style={styles.modalInput} keyboardType="number-pad" />

            <Text style={styles.fieldLabel}>Titular Cuenta *</Text>
            <TextInput value={accountHolder} onChangeText={setAccountHolder} placeholder="Titular" placeholderTextColor="#8a92a1" style={styles.modalInput} />

            <Text style={styles.fieldLabel}>Tipo de cuenta *</Text>
            <Pressable style={styles.pickerButton} onPress={() => setPickerTypeOpen((prev) => !prev)}>
              <Text style={styles.pickerButtonText}>{accountType || 'Seleccionar'}</Text>
            </Pressable>
            {pickerTypeOpen && (
              <View style={styles.pickerListInline}>
                {ACCOUNT_TYPES.map((type) => (
                  <Pressable key={type} style={styles.pickerItem} onPress={() => { setAccountType(type); setPickerTypeOpen(false); }}>
                    <Text style={styles.pickerItemText}>{type}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={styles.fieldLabel}>Banco *</Text>
            <Pressable style={styles.pickerButton} onPress={() => { setPickerBankTarget('add'); setPickerBankOpen(true); }}>
              <Text style={styles.pickerButtonText}>{bankName || 'Seleccionar banco'}</Text>
            </Pressable>

            {formError.length > 0 && <Text style={styles.errorText}>{formError}</Text>}

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalActionBtn, styles.modalCancelBtn]} onPress={closeAddModal}><Text style={styles.modalCancelBtnText}>Cancelar</Text></Pressable>
              <Pressable style={[styles.modalActionBtn, styles.modalConfirmBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}><Text style={styles.modalActionBtnText}>{saving ? 'Guardando...' : 'Guardar'}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={editModalVisible} onRequestClose={closeEditModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Cuenta Bancaria</Text>
              <Pressable onPress={closeEditModal}><Feather name="x" size={24} color="#2a2f3d" /></Pressable>
            </View>

            <Text style={styles.fieldLabel}>Número de Cuenta *</Text>
            <TextInput value={editNumber} onChangeText={(v) => setEditNumber(accountValueOnlyNumbers(v))} placeholder="Solo números" placeholderTextColor="#8a92a1" style={styles.modalInput} keyboardType="number-pad" />

            <Text style={styles.fieldLabel}>Titular Cuenta *</Text>
            <TextInput value={editHolder} onChangeText={setEditHolder} placeholder="Titular" placeholderTextColor="#8a92a1" style={styles.modalInput} />

            <Text style={styles.fieldLabel}>Tipo de cuenta *</Text>
            <Pressable style={styles.pickerButton} onPress={() => setEditTypeOpen((prev) => !prev)}>
              <Text style={styles.pickerButtonText}>{editType || 'Seleccionar'}</Text>
            </Pressable>
            {editTypeOpen && (
              <View style={styles.pickerListInline}>
                {ACCOUNT_TYPES.map((type) => (
                  <Pressable key={type} style={styles.pickerItem} onPress={() => { setEditType(type); setEditTypeOpen(false); }}>
                    <Text style={styles.pickerItemText}>{type}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={styles.fieldLabel}>Banco *</Text>
            <Pressable style={styles.pickerButton} onPress={() => { setPickerBankTarget('edit'); setPickerBankOpen(true); }}>
              <Text style={styles.pickerButtonText}>{editBank || 'Seleccionar banco'}</Text>
            </Pressable>

            {editError.length > 0 && <Text style={styles.errorText}>{editError}</Text>}

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalActionBtn, styles.modalCancelBtn]} onPress={closeEditModal}><Text style={styles.modalCancelBtnText}>Cancelar</Text></Pressable>
              <Pressable style={[styles.modalActionBtn, styles.modalConfirmBtn, editSaving && { opacity: 0.6 }]} onPress={handleUpdate} disabled={editSaving}><Text style={styles.modalActionBtnText}>{editSaving ? 'Guardando...' : 'Actualizar'}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={deleteModalVisible} onRequestClose={closeDeleteModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Eliminar Cuenta</Text>
              <Pressable onPress={closeDeleteModal}><Feather name="x" size={24} color="#2a2f3d" /></Pressable>
            </View>

            <Text style={styles.deleteMessage}>¿Deseas eliminar esta cuenta bancaria?</Text>
            {deleteError.length > 0 && <Text style={styles.errorText}>{deleteError}</Text>}

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalActionBtn, styles.modalCancelBtn]} onPress={closeDeleteModal}><Text style={styles.modalCancelBtnText}>Cancelar</Text></Pressable>
              <Pressable style={[styles.modalActionBtn, styles.deleteBtnModal, deleteLoading && { opacity: 0.6 }]} onPress={handleDelete} disabled={deleteLoading}><Text style={styles.modalActionBtnText}>{deleteLoading ? 'Eliminando...' : 'Eliminar'}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={pickerClientOpen} onRequestClose={() => setPickerClientOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Emprendedor</Text>
              <Pressable onPress={() => setPickerClientOpen(false)}><Feather name="x" size={24} color="#2a2f3d" /></Pressable>
            </View>
            <TextInput value={clientSearch} onChangeText={setClientSearch} placeholder="Buscar emprendedor" placeholderTextColor="#8a92a1" style={styles.bankSearchInput} />
            <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
              {filteredClientsForPicker.map((client) => (
                <Pressable key={String(client.id)} style={styles.pickerItem} onPress={() => { setSelectedClient(client); setPickerClientOpen(false); }}>
                  <Text style={styles.pickerItemText}>{(client.name || 'EMPRENDEDOR').toUpperCase()}</Text>
                </Pressable>
              ))}
              {filteredClientsForPicker.length === 0 && <Text style={styles.emptyText}>No se encontraron emprendedores.</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={pickerBankOpen} onRequestClose={() => setPickerBankOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Banco</Text>
              <Pressable onPress={() => setPickerBankOpen(false)}><Feather name="x" size={24} color="#2a2f3d" /></Pressable>
            </View>
            <TextInput value={bankSearch} onChangeText={setBankSearch} placeholder="Buscar banco" placeholderTextColor="#8a92a1" style={styles.bankSearchInput} />
            <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
              {filteredBanks.map((bank) => (
                <Pressable key={bank} style={styles.pickerItem} onPress={() => {
                  if (pickerBankTarget === 'add') {
                    setBankName(bank);
                  } else {
                    setEditBank(bank);
                  }
                  setPickerBankOpen(false);
                }}>
                  <Text style={styles.pickerItemText}>{bank}</Text>
                </Pressable>
              ))}
              {filteredBanks.length === 0 && <Text style={styles.emptyText}>No se encontraron bancos.</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
