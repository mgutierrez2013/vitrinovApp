import { StyleSheet } from 'react-native';

export const transactionsFilterStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 110,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  miniLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#252a38',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  dateInputButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderColor: '#dfe3ef',
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  dateInputButtonText: {
    fontSize: 16,
    color: '#273143',
  },
  clientInput: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe3ef',
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#273143',
    marginBottom: 12,
  },
  salesCard: {
    backgroundColor: '#6d4ec4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salesTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 17,
  },
  salesValue: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 17,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#e9d9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#6746be',
    fontWeight: '700',
    fontSize: 13,
  },
  body: {
    flex: 1,
  },
  titleText: {
    color: '#293040',
    fontSize: 16,
    fontWeight: '800',
  },
  subtitleText: {
    color: '#7153c6',
    fontSize: 13,
    fontWeight: '700',
  },
  dateText: {
    color: '#6f7383',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  amountIncome: {
    color: '#2e9d68',
    fontSize: 15,
    fontWeight: '800',
  },
  amountExpense: {
    color: '#c85353',
    fontSize: 15,
    fontWeight: '800',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyText: {
    color: '#666b7a',
    fontSize: 14,
    marginTop: 8,
  },
  bottomActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 22,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  clearBtn: {
    backgroundColor: '#e53f3f',
  },
  backBtn: {
    backgroundColor: '#7c59d7',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
