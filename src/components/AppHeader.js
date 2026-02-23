import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

export function AppHeader({ onLogout }) {
  return (
    <>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>6:15</Text>
        <View style={styles.statusRight}>
          <View style={styles.signalWrap}>
            <View style={[styles.signalBar, { height: 7, opacity: 0.5 }]} />
            <View style={[styles.signalBar, { height: 9, opacity: 0.7 }]} />
            <View style={[styles.signalBar, { height: 10, opacity: 0.85 }]} />
            <View style={[styles.signalBar, { height: 11, opacity: 1 }]} />
          </View>
          <Text style={styles.statusText}>60%</Text>
        </View>
      </View>

      <View style={styles.brandRow}>
        <View style={styles.logoCard}>
          <Text style={styles.logoText}>
            VITRIN<Text style={styles.logoTextHighlight}>O</Text>VA
          </Text>
        </View>

        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Feather name="log-out" size={14} color="#fff" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>

      <View style={styles.waveWrap}>
        <View style={styles.wave} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    backgroundColor: '#F5A623',
    height: 44,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  signalWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  signalBar: {
    width: 3,
    borderRadius: 1,
    backgroundColor: '#fff',
  },
  brandRow: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoCard: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
    padding: 5,
  },
  logoText: {
    color: '#1A3F6F',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 12,
  },
  logoTextHighlight: {
    color: '#F5A623',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  waveWrap: {
    backgroundColor: '#F5A623',
    height: 18,
    overflow: 'hidden',
  },
  wave: {
    flex: 1,
    backgroundColor: '#F2F4F7',
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    transform: [{ scaleX: 1.25 }],
  },
});
