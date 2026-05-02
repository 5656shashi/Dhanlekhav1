import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  ACCESS: '@dl_access',
  REFRESH: '@dl_refresh',
  USER: '@dl_user',
};

export const storage = {
  getAccessToken: () => AsyncStorage.getItem(K.ACCESS),
  setAccessToken: (t: string) => AsyncStorage.setItem(K.ACCESS, t),
  getRefreshToken: () => AsyncStorage.getItem(K.REFRESH),
  setRefreshToken: (t: string) => AsyncStorage.setItem(K.REFRESH, t),
  setTokens: (access: string, refresh: string) =>
    Promise.all([AsyncStorage.setItem(K.ACCESS, access), AsyncStorage.setItem(K.REFRESH, refresh)]),
  getUser: async (): Promise<any | null> => {
    const raw = await AsyncStorage.getItem(K.USER);
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user: any) => AsyncStorage.setItem(K.USER, JSON.stringify(user)),
  clearAll: () => AsyncStorage.multiRemove(Object.values(K)),
};
