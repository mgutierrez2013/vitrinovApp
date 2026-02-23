import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { addBankAccount, getClientsList } from '../services/transactionsService';
import { getCachedSession } from '../services/sessionService';
import { bankAccountsStyles as styles } from '../theme/bankAccountsStyles';

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

export function BankAccountsScreen({ onGoHome, onGoEntrepreneurs, onSessionExpired, onLogout, onOpenClientAccounts }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountType, setAccountType] = useState('Cuenta Ahorro');
  const [bankName, setBankName] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [showClientSheet, setShowClientSheet] = useState(false);
  const [showBankSheet, setShowBankSheet] = useState(false);
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

  const accountCountByClient = useMemo(() => {
    const map = {};
    clients.forEach((c) => {
      map[c.id] = 0;
    });
    return map;
  }, [clients]);

  const closeModal = () => {
    setModalVisible(false);
    setSelectedClient(null);
    setAccountNumber('');
    setAccountHolder('');
    setAccountType('Cuenta Ahorro');
    setBankName('');
    setClientSearch('');
    setBankSearch('');
    setFormError('');
    setShowClientSheet(false);
    setShowBankSheet(false);
  };

  const handleSave = async () => {
    const session = getCachedSession();
    if (!session?.token) {
      closeModal();
      onSessionExpired();
      return;
    }

    const num = accountNumber.trim();
    const holder = accountHolder.trim();

    if (!selectedClient?.id) {
      setFormError('Selecciona un emprendedor.');
      return;
    }
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
        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="log-out" size={15} color="#fff" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.titleBlock}>
          <Text style={styles.titleOverline}>Gestión</Text>
          <Text style={styles.title}>Cuentas Bancarias</Text>
          <Text style={styles.titleHint}>{clients.length} emprendedores registrados</Text>
        </View>

        <View style={styles.searchWrap}>
          <Feather name="search" size={15} color="#8a92a1" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar emprendedor"
            placeholderTextColor="#8a92a1"
            style={styles.searchInput}
          />
          {!!search && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <Text style={styles.emptyText}>Cargando emprendedores...</Text>
        ) : (
          <FlatList
            data={filteredClients}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <Pressable style={[styles.clientCard, { borderLeftColor: item?.color || '#F5A623' }]} onPress={() => onOpenClientAccounts(item)}>
                <View style={[styles.clientIconWrap, { backgroundColor: item?.color || '#F5A623' }]}>
                  <Text style={styles.clientIconText}>{getInitials(item?.name || '')}</Text>
                </View>

                <View style={styles.clientBody}>
                  <Text style={styles.clientName} numberOfLines={1}>{(item?.name || 'EMPRENDEDOR').toUpperCase()}</Text>
                  <Text style={styles.clientSubtitle}>Emprendedor</Text>
                </View>

                <View style={styles.clientBadges}>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{accountCountByClient[item.id] || 0} cuentas</Text>
                  </View>
                  <Text style={styles.clientChevron}>›</Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>{error || 'No se encontraron emprendedores.'}</Text>}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View style={styles.primaryButtonWrap}>
        <Pressable style={styles.primaryButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.primaryButtonText}>🏦 + Cuenta Bancaria</Text>
        </Pressable>
      </View>

      <View style={styles.bottomBar}>
        <Pressable style={styles.bottomTab} onPress={onGoHome}>
          <View style={styles.bottomTabIcon}><Feather name="home" size={18} color="#a6aab6" /></View>
          <Text style={styles.bottomTabText}>Inicio</Text>
        </Pressable>
        <Pressable style={styles.bottomTab} onPress={onGoEntrepreneurs}>
          <View style={styles.bottomTabIcon}><Feather name="users" size={18} color="#a6aab6" /></View>
          <Text style={styles.bottomTabText}>Clientes</Text>
        </Pressable>
        <View style={styles.bottomTab}>
          <View style={[styles.bottomTabIcon, styles.bottomTabIconActive]}><Feather name="credit-card" size={18} color="#f59e0b" /></View>
          <Text style={[styles.bottomTabText, styles.bottomTabTextActive]}>Pagos</Text>
        </View>
      </View>

      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalOverline}>Nueva</Text>
                <Text style={styles.modalTitle}>Agregar Cuenta Bancaria</Text>
              </View>
              <Pressable style={styles.modalCloseBtn} onPress={closeModal}><Feather name="x" size={20} color="#555" /></Pressable>
            </View>

            <Text style={styles.fieldLabel}>Emprendedor *</Text>
            <Pressable style={styles.selectorBtn} onPress={() => setShowClientSheet(true)}>
              <Text style={styles.selectorBtnText}>{selectedClient?.name || 'Seleccionar emprendedor'}</Text>
            </Pressable>

            <Text style={styles.fieldLabel}>Número de Cuenta *</Text>
            <TextInput value={accountNumber} onChangeText={(v) => setAccountNumber(v.replace(/[^0-9]/g, ''))} placeholder="Solo números" placeholderTextColor="#8a92a1" style={styles.modalInput} keyboardType="number-pad" />

            <Text style={styles.fieldLabel}>Titular Cuenta *</Text>
            <TextInput value={accountHolder} onChangeText={setAccountHolder} placeholder="Nombre completo del titular" placeholderTextColor="#8a92a1" style={styles.modalInput} />

            <Text style={styles.fieldLabel}>Tipo de cuenta *</Text>
            <View style={styles.chipsWrap}>
              {ACCOUNT_TYPES.map((type) => (
                <Pressable key={type} style={[styles.typeChip, accountType === type && styles.typeChipActive]} onPress={() => setAccountType(type)}>
                  <Text style={[styles.typeChipText, accountType === type && styles.typeChipTextActive]}>{type}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Banco *</Text>
            <Pressable style={styles.selectorBtn} onPress={() => setShowBankSheet(true)}>
              <Text style={styles.selectorBtnText}>{bankName || 'Seleccionar banco'}</Text>
            </Pressable>

            {formError.length > 0 && <Text style={styles.errorText}>{formError}</Text>}

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalActionBtn, styles.modalConfirmBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                <Text style={styles.modalActionBtnText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
              </Pressable>
              <Pressable style={[styles.modalActionBtn, styles.modalCancelBtn]} onPress={closeModal}>
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Modal transparent animationType="fade" visible={showClientSheet} onRequestClose={() => setShowClientSheet(false)}>
          <View style={styles.sheetBackdrop}>
            <View style={styles.sheetCard}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Seleccionar Emprendedor</Text>
                <Pressable style={styles.modalCloseBtn} onPress={() => setShowClientSheet(false)}><Feather name="x" size={18} color="#555" /></Pressable>
              </View>
              <View style={styles.searchWrap}>
                <Feather name="search" size={15} color="#8a92a1" />
                <TextInput value={clientSearch} onChangeText={setClientSearch} placeholder="Buscar emprendedor" placeholderTextColor="#8a92a1" style={styles.searchInput} />
              </View>
              <ScrollView style={styles.sheetScroll}>
                {filteredClientsForPicker.map((client) => (
                  <Pressable key={String(client.id)} style={styles.sheetItem} onPress={() => { setSelectedClient(client); setShowClientSheet(false); }}>
                    <Text style={styles.sheetItemText}>{(client.name || 'EMPRENDEDOR').toUpperCase()}</Text>
                    <Text style={styles.clientChevron}>›</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal transparent animationType="fade" visible={showBankSheet} onRequestClose={() => setShowBankSheet(false)}>
          <View style={styles.sheetBackdrop}>
            <View style={styles.sheetCard}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Seleccionar Banco</Text>
                <Pressable style={styles.modalCloseBtn} onPress={() => setShowBankSheet(false)}><Feather name="x" size={18} color="#555" /></Pressable>
              </View>
              <View style={styles.searchWrap}>
                <Feather name="search" size={15} color="#8a92a1" />
                <TextInput value={bankSearch} onChangeText={setBankSearch} placeholder="Buscar banco" placeholderTextColor="#8a92a1" style={styles.searchInput} />
              </View>
              <ScrollView style={styles.sheetScroll}>
                {filteredBanks.map((bank) => (
                  <Pressable key={bank} style={styles.sheetItem} onPress={() => { setBankName(bank); setShowBankSheet(false); }}>
                    <Text style={styles.sheetItemText}>{bank}</Text>
                    <Text style={styles.clientChevron}>›</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Modal>
    </View>
  );
}
