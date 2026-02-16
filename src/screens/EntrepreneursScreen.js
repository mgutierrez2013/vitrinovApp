import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import {
  addClient,
  deleteClient,
  getClientsList,
  updateClient,
} from '../services/transactionsService';
import { getCachedSession } from '../services/sessionService';
import { entrepreneursStyles as styles } from '../theme/entrepreneursStyles';

const logoUri =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrlgf2hRazz-UN3KEa32BKxj4T0C3RmJ0vCw&s';

export function EntrepreneursScreen({ onLogout, onSessionExpired, onGoHome, onOpenAccount }) {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const swipeableRefs = useRef({});

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingClient, setDeletingClient] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
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

        setClients(result.clients ?? []);
      } catch (_e) {
        setClients([]);
        setError('No se obtuvieron resultado.');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [onSessionExpired, refreshTick]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return clients;
    }

    return clients.filter((item) => (item?.name || '').toLowerCase().includes(term));
  }, [clients, search]);

  const closeAllSwipeables = () => {
    Object.values(swipeableRefs.current).forEach((ref) => ref?.close?.());
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
    setNewName('');
    setAddError('');
  };

  const handleAddClient = async () => {
    const session = getCachedSession();

    if (!session?.token) {
      closeAddModal();
      onSessionExpired();
      return;
    }

    const trimmed = newName.trim();

    if (trimmed.length < 5) {
      setAddError('El nombre debe tener al menos 5 caracteres.');
      return;
    }

    try {
      setAddLoading(true);
      setAddError('');

      const result = await addClient({ token: session.token, name: trimmed });

      if (result.tokenExpired) {
        closeAddModal();
        onSessionExpired();
        return;
      }

      if (!result.ok) {
        setAddError(result.message || 'No fue posible agregar el emprendedor.');
        return;
      }

      closeAddModal();
      setRefreshTick((prev) => prev + 1);
    } catch (_e) {
      setAddError('No fue posible agregar el emprendedor.');
    } finally {
      setAddLoading(false);
    }
  };

  const openEditModal = (item) => {
    setEditingClient(item);
    setEditName(item?.name || '');
    setEditError('');
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    closeAllSwipeables();
    setEditModalVisible(false);
    setEditingClient(null);
    setEditName('');
    setEditError('');
  };

  const handleUpdateClient = async () => {
    const session = getCachedSession();

    if (!session?.token) {
      closeEditModal();
      onSessionExpired();
      return;
    }

    if (!editingClient?.id) {
      setEditError('No se encontró el emprendedor.');
      return;
    }

    const trimmed = editName.trim();

    if (trimmed.length < 5) {
      setEditError('El nombre debe tener al menos 5 caracteres.');
      return;
    }

    try {
      setEditLoading(true);
      setEditError('');

      const result = await updateClient({
        token: session.token,
        clientId: editingClient.id,
        name: trimmed,
      });

      if (result.tokenExpired) {
        closeEditModal();
        onSessionExpired();
        return;
      }

      if (!result.ok) {
        setEditError(result.message || 'No fue posible actualizar el emprendedor.');
        return;
      }

      closeEditModal();
      setRefreshTick((prev) => prev + 1);
    } catch (_e) {
      setEditError('No fue posible actualizar el emprendedor.');
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteModal = (item) => {
    setDeletingClient(item);
    setDeleteError('');
    setDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    closeAllSwipeables();
    setDeleteModalVisible(false);
    setDeletingClient(null);
    setDeleteError('');
  };

  const handleDeleteClient = async () => {
    const session = getCachedSession();

    if (!session?.token) {
      closeDeleteModal();
      onSessionExpired();
      return;
    }

    if (!deletingClient?.id) {
      setDeleteError('No se encontró el emprendedor.');
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError('');

      const result = await deleteClient({ token: session.token, clientId: deletingClient.id });

      if (result.tokenExpired) {
        closeDeleteModal();
        onSessionExpired();
        return;
      }

      if (!result.ok) {
        setDeleteError(result.message || 'No fue posible eliminar el emprendedor.');
        return;
      }

      closeDeleteModal();
      setRefreshTick((prev) => prev + 1);
    } catch (_e) {
      setDeleteError('No fue posible eliminar el emprendedor.');
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

  const renderSwipeGhost = () => <View style={styles.swipeGhostAction} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Image source={{ uri: logoUri }} style={styles.logoImage} resizeMode="cover" />
        </View>

        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="log-out" size={15} color="#ffffff" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Emprendedores</Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar emprendedor"
          placeholderTextColor="#8a92a1"
          style={styles.searchInput}
        />

        {loading ? (
          <Text style={styles.emptyText}>Cargando emprendedores...</Text>
        ) : (
          <FlatList
            data={filteredClients}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
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
                <Pressable style={styles.clientCard} onPress={() => onOpenAccount(item)}>
                  <View style={styles.clientIconWrap}>
                    <Feather name="users" size={24} color="#1f2433" />
                  </View>

                  <View style={styles.clientBody}>
                    <Text style={styles.clientName} numberOfLines={1}>
                      {(item.name || 'EMPRENDEDOR').toUpperCase()}
                    </Text>
                    <Text style={styles.clientSubtitle}>Emprendedor</Text>
                  </View>
                </Pressable>
              </Swipeable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{error || 'No se encontraron emprendedores.'}</Text>
            }
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Pressable style={styles.primaryButton} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.primaryButtonText}>Emprendedor</Text>
        </Pressable>
      </View>

      <View style={styles.bottomBar}>
        <Pressable style={styles.bottomIconWrap} onPress={onGoHome}>
          <Feather name="home" size={24} color="#7c59d7" />
        </Pressable>
        <View style={styles.bottomIconWrapActive}>
          <Feather name="users" size={24} color="#ffffff" />
        </View>
        <View style={styles.bottomIconWrap}>
          <Feather name="settings" size={24} color="#7c59d7" />
        </View>
      </View>

      <Modal transparent animationType="fade" visible={addModalVisible} onRequestClose={closeAddModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Emprendedor</Text>
              <Pressable onPress={closeAddModal}>
                <Feather name="x" size={28} color="#2a2f3d" />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Nombre"
              placeholderTextColor="#8a92a1"
              style={[styles.modalInput, addError ? styles.modalInputError : null]}
            />
            {addError.length > 0 && <Text style={styles.errorText}>{addError}</Text>}

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalActionBtn, styles.modalCancelBtn]} onPress={closeAddModal}>
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalActionBtn, styles.modalConfirmBtn, addLoading && { opacity: 0.6 }]}
                onPress={handleAddClient}
                disabled={addLoading}
              >
                <Text style={styles.modalActionBtnText}>{addLoading ? 'Agregando...' : 'Agregar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={editModalVisible} onRequestClose={closeEditModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Emprendedor</Text>
              <Pressable onPress={closeEditModal}>
                <Feather name="x" size={28} color="#2a2f3d" />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Nombre"
              placeholderTextColor="#8a92a1"
              style={[styles.modalInput, editError ? styles.modalInputError : null]}
            />
            {editError.length > 0 && <Text style={styles.errorText}>{editError}</Text>}

            <View style={styles.modalActionsRow}>
              <Pressable style={[styles.modalActionBtn, styles.modalCancelBtn]} onPress={closeEditModal}>
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalActionBtn, styles.modalConfirmBtn, editLoading && { opacity: 0.6 }]}
                onPress={handleUpdateClient}
                disabled={editLoading}
              >
                <Text style={styles.modalActionBtnText}>{editLoading ? 'Guardando...' : 'Actualizar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={deleteModalVisible} onRequestClose={closeDeleteModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.deleteModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.deleteModalTitle}>Confirmar Eliminación</Text>
              <Pressable onPress={closeDeleteModal}>
                <Feather name="x" size={28} color="#2a2f3d" />
              </Pressable>
            </View>

            <Text style={styles.deleteModalMessage}>
              ¿Está seguro de que deseas eliminar a{' '}
              <Text style={styles.deleteModalStrong}>{(deletingClient?.name || '').toUpperCase()}</Text>?
            </Text>

            {deleteError.length > 0 && <Text style={styles.errorText}>{deleteError}</Text>}

            <View style={styles.deleteActionsRow}>
              <Pressable style={[styles.deleteBtn, styles.deleteCancelBtn]} onPress={closeDeleteModal}>
                <Text style={styles.deleteCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.deleteBtn, styles.deleteConfirmBtn, deleteLoading && { opacity: 0.6 }]}
                onPress={handleDeleteClient}
                disabled={deleteLoading}
              >
                <Text style={styles.deleteConfirmText}>{deleteLoading ? 'Eliminando...' : 'Eliminar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
