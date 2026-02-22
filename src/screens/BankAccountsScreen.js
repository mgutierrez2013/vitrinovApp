import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { addBankAccount, getClientsList } from '../services/transactionsService';
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

export function BankAccountsScreen({ onGoHome, onGoEntrepreneurs, onSessionExpired, onLogout, onOpenClientAccounts }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [error, setError] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountType, setAccountType] = useState('Cuenta Ahorro');
  const [bankName, setBankName] = useState('');

  const [pickerTypeOpen, setPickerTypeOpen] = useState(false);
  const [pickerBankOpen, setPickerBankOpen] = useState(false);
  const [pickerClientOpen, setPickerClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [bankSearch, setBankSearch] = useState('');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const run = async () => {
      const session = getCachedSession();
      if (!session?.token) {
        onSessionExpired();
        return;
      }
      try {
        setLoading(true);
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
        setLoading(false);
      }
    };

    run();
  }, [onSessionExpired]);

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

  const resetForm = () => {
    setAccountNumber('');
    setAccountHolder('');
    setAccountType('Cuenta Ahorro');
    setBankName('');
    setPickerTypeOpen(false);
    setBankSearch('');
    setFormError('');
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleSave = async () => {
    const session = getCachedSession();
    if (!session?.token) {
      closeModal();
      onSessionExpired();
      return;
    }

    if (!selectedClient?.id) {
      setFormError('Selecciona un emprendedor del listado.');
      return;
    }

    const num = accountNumber.trim();
    const holder = accountHolder.trim();

    if (!/^\d+$/.test(num)) {
      setFormError('Número de cuenta: solo números.');
      return;
    }
    if (holder.length < 5) {
      setFormError('Titular de cuenta debe tener al menos 5 caracteres.');
      return;
    }
    if (!ACCOUNT_TYPES.includes(accountType)) {
      setFormError('Selecciona un tipo de cuenta válido.');
      return;
    }
    if (!BANK_OPTIONS.includes(bankName)) {
      setFormError('Selecciona un banco válido.');
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
        closeModal();
        onSessionExpired();
        return;
      }

      if (!result.ok) {
        setFormError(result.message || 'No fue posible agregar la cuenta bancaria.');
        return;
      }

      closeModal();
    } catch (_e) {
      setFormError('No fue posible agregar la cuenta bancaria.');
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
        <Text style={styles.title}>Cuentas Bancarias</Text>
        <TextInput value={search} onChangeText={setSearch} placeholder="Buscar emprendedor" placeholderTextColor="#8a92a1" style={styles.searchInput} />

        {loading ? (
          <Text style={styles.emptyText}>Cargando emprendedores...</Text>
        ) : (
          <FlatList
            data={filteredClients}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const selected = selectedClient?.id === item.id;

              return (
                <Pressable
                  style={[styles.clientCard, selected && styles.clientCardSelected]}
                  onPress={() => {
                    setSelectedClient(item);
                    onOpenClientAccounts(item);
                  }}
                >
                  <View style={styles.clientIconWrap}><Feather name="users" size={20} color="#1f2433" /></View>
                  <View style={styles.clientBody}>
                    <Text style={styles.clientName} numberOfLines={1}>{(item?.name || 'EMPRENDEDOR').toUpperCase()}</Text>
                    <Text style={styles.clientSubtitle}>Emprendedor</Text>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={<Text style={styles.emptyText}>{error || 'No se encontraron emprendedores.'}</Text>}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Pressable style={styles.primaryButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.primaryButtonText}>Cuenta Bancaria</Text>
        </Pressable>
      </View>

      <View style={styles.bottomBar}>
        <Pressable style={styles.bottomIconWrap} onPress={onGoHome}><Feather name="home" size={24} color="#0f6dbb" /></Pressable>
        <Pressable style={styles.bottomIconWrap} onPress={onGoEntrepreneurs}><Feather name="users" size={24} color="#0f6dbb" /></Pressable>
        <View style={styles.bottomIconWrapActive}><Feather name="credit-card" size={24} color="#0f6dbb" /></View>
      </View>

      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Cuenta Bancaria</Text>
              <Pressable onPress={closeModal}><Feather name="x" size={24} color="#2a2f3d" /></Pressable>
            </View>

            <Text style={styles.fieldLabel}>Emprendedor *</Text>
            <Pressable style={styles.pickerButton} onPress={() => setPickerClientOpen(true)}>
              <Text style={styles.pickerButtonText}>{(selectedClient?.name || 'Seleccionar emprendedor').toUpperCase()}</Text>
            </Pressable>

            <Text style={styles.fieldLabel}>Número de Cuenta *</Text>
            <TextInput value={accountNumber} onChangeText={(v) => setAccountNumber(v.replace(/[^0-9]/g, ''))} placeholder="Solo números" placeholderTextColor="#8a92a1" style={styles.modalInput} keyboardType="number-pad" />

            <Text style={styles.fieldLabel}>Titular Cuenta *</Text>
            <TextInput value={accountHolder} onChangeText={setAccountHolder} placeholder="Titular" placeholderTextColor="#8a92a1" style={styles.modalInput} />

            <Text style={styles.fieldLabel}>Tipo de cuenta *</Text>
            <Pressable style={styles.pickerButton} onPress={() => setPickerTypeOpen((p) => !p)}>
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
            <Pressable style={styles.pickerButton} onPress={() => setPickerBankOpen(true)}>
              <Text style={styles.pickerButtonText}>{bankName || 'Seleccionar banco'}</Text>
            </Pressable>

            {formError.length > 0 && <Text style={styles.errorText}>{formError}</Text>}

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalActionBtn, styles.modalCancelBtn]} onPress={closeModal}><Text style={styles.modalCancelBtnText}>Cancelar</Text></Pressable>
              <Pressable style={[styles.modalActionBtn, styles.modalConfirmBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}><Text style={styles.modalActionBtnText}>{saving ? 'Guardando...' : 'Guardar'}</Text></Pressable>
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
                <Pressable key={bank} style={styles.pickerItem} onPress={() => { setBankName(bank); setPickerBankOpen(false); }}>
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
