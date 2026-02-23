import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

const tabs = [
  { icon: 'home', label: 'Inicio' },
  { icon: 'users', label: 'Clientes' },
  { icon: 'credit-card', label: 'Pagos' },
];

export function AppFooter({ activeIndex = 0, onChange }) {
  return (
    <View style={styles.footer}>
      {tabs.map((tab, index) => {
        const active = index === activeIndex;
        const Wrapper = onChange && !active ? Pressable : View;

        return (
          <Wrapper key={tab.label} style={styles.tab} onPress={onChange ? () => onChange(index) : undefined}>
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Feather name={tab.icon} size={18} color={active ? '#F5A623' : '#a6aab6'} />
            </View>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
          </Wrapper>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 22,
  },
  tab: {
    alignItems: 'center',
    gap: 3,
    minWidth: 64,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: '#FFF0D6',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#aaa',
  },
  tabTextActive: {
    color: '#F5A623',
  },
});
