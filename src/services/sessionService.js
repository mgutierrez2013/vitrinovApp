import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@vitrinov/session';

let cachedSession = {
  token: null,
  user: null,
};

export async function saveSession({ token, user }) {
  cachedSession = { token, user };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(cachedSession));
  return cachedSession;
}

export async function loadSession() {
  const raw = await AsyncStorage.getItem(SESSION_KEY);

  if (!raw) {
    return cachedSession;
  }

  try {
    cachedSession = JSON.parse(raw);
    return cachedSession;
  } catch (error) {
    cachedSession = { token: null, user: null };
    return cachedSession;
  }
}

export function getCachedSession() {
  return cachedSession;
}

export async function clearSession() {
  cachedSession = { token: null, user: null };
  await AsyncStorage.removeItem(SESSION_KEY);
}
