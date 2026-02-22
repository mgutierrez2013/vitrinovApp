import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  keyboardScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  card: {
    borderRadius: 32,
    backgroundColor: '#ffffff',
    paddingHorizontal: 26,
    paddingVertical: 24,
    shadowColor: '#151515',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 6,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 2,
  },
  brandImage: {
    width: '94%',
    height: 108,
  },
  fieldBlock: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '700',
    color: '#1d2332',
  },
  input: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#d6dbe7',
    backgroundColor: '#f4f7fb',
    paddingHorizontal: 16,
    height: 44,
    fontSize: 16,
    color: '#273143',
  },
  inputError: {
    borderColor: '#d64c62',
  },
  errorText: {
    color: '#bf4358',
    marginTop: 5,
    fontSize: 12,
    textAlign: 'center',
  },
  passwordContainer: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#d6dbe7',
    backgroundColor: '#f4f7fb',
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#273143',
  },
  ctaButton: {
    marginTop: 6,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#1e74c6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0e5fa8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  ctaText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  ctaButtonDisabled: {
    opacity: 0.75,
  },
  switchText: {
    marginTop: 14,
    textAlign: 'center',
    color: '#0f6dbb',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalCard: {
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  modalTitle: {
    color: '#23283a',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  modalMessage: {
    color: '#4b5165',
    fontSize: 14,
    marginBottom: 14,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalButton: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalButtonSecondary: {
    backgroundColor: '#edf0f8',
  },
  modalButtonPrimary: {
    backgroundColor: '#1e74c6',
  },
  modalButtonTextSecondary: {
    color: '#36415c',
    fontWeight: '700',
    fontSize: 13,
  },
  modalButtonTextPrimary: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
