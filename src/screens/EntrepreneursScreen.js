import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getClientsList } from '../services/transactionsService';
import { getCachedSession } from '../services/sessionService';
import { entrepreneursStyles as styles } from '../theme/entrepreneursStyles';

const logoUri =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrlgf2hRazz-UN3KEa32BKxj4T0C3RmJ0vCw&s';

export function EntrepreneursScreen({ onLogout, onSessionExpired, onGoHome }) {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

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
  }, [onSessionExpired]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return clients;
    }

    return clients.filter((item) => (item?.name || '').toLowerCase().includes(term));
  }, [clients, search]);

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
              <View style={styles.clientCard}>
                <View style={styles.clientIconWrap}>
                  <Feather name="users" size={26} color="#1f2433" />
                </View>

                <View style={styles.clientBody}>
                  <Text style={styles.clientName} numberOfLines={1}>
                    {(item.name || 'EMPRENDEDOR').toUpperCase()}
                  </Text>
                  <Text style={styles.clientSubtitle}>Emprendedor</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{error || 'No se encontraron emprendedores.'}</Text>
            }
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Pressable style={styles.primaryButton}>
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
    </View>
  );
}
