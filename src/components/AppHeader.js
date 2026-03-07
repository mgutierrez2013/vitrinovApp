import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

const ACTIONS = [
  { key: 'home', label: 'Inicio', icon: 'home' },
  { key: 'clients', label: 'Clientes', icon: 'users' },
  { key: 'payments', label: 'Pagos', icon: 'credit-card' },
  { key: 'logout', label: 'Salir', icon: 'log-out' },
];

export function AppHeader({ onLogout, onGoHome, onGoEntrepreneurs, onGoBankAccounts, activeTab = 'home' }) {
  const [actionsVisible, setActionsVisible] = useState(false);

  const handleAction = (key) => {
    setActionsVisible(false);

    if (key === 'home') {
      onGoHome?.();
      return;
    }

    if (key === 'clients') {
      onGoEntrepreneurs?.();
      return;
    }

    if (key === 'payments') {
      onGoBankAccounts?.();
      return;
    }

    if (key === 'logout') {
      onLogout?.();
    }
  };

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

        <Pressable style={styles.actionsFab} onPress={() => setActionsVisible(true)}>
          <Feather name="grid" size={16} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.waveWrap}>
        <View style={styles.wave} />
      </View>

      <Modal transparent animationType="fade" visible={actionsVisible} onRequestClose={() => setActionsVisible(false)}>
        <Pressable style={styles.actionsBackdrop} onPress={() => setActionsVisible(false)}>
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Acciones</Text>
            <View style={styles.actionsGrid}>
              {ACTIONS.map((action) => {
                const selected =
                  (activeTab === 'home' && action.key === 'home')
                  || (activeTab === 'clients' && action.key === 'clients')
                  || (activeTab === 'payments' && action.key === 'payments');
                return (
                  <Pressable key={action.key} style={styles.actionItem} onPress={() => handleAction(action.key)}>
                    <View style={[styles.actionIconWrap, selected && styles.actionIconWrapActive, action.key === 'logout' && styles.actionIconWrapLogout]}>
                      <Feather name={action.icon} size={15} color={selected ? '#F5A623' : action.key === 'logout' ? '#e8453c' : '#1A3F6F'} />
                    </View>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
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
  actionsFab: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(26,63,111,0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
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
  actionsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 96,
    paddingRight: 16,
  },
  actionsCard: {
    width: 212,
    borderRadius: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionsTitle: {
    color: '#1A3F6F',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionItem: {
    width: '47%',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#edf0f6',
    backgroundColor: '#f8f9fc',
    paddingVertical: 8,
    gap: 4,
  },
  actionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf2ff',
  },
  actionIconWrapActive: {
    backgroundColor: '#fff0d6',
  },
  actionIconWrapLogout: {
    backgroundColor: '#ffe9e8',
  },
  actionLabel: {
    color: '#2e3448',
    fontSize: 11,
    fontWeight: '700',
  },
});
