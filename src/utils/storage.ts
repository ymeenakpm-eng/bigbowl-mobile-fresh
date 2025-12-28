import * as SecureStore from 'expo-secure-store';

type StoredValue = string | null;

export async function getStoredItem(key: string): Promise<StoredValue> {
  try {
    const v = await SecureStore.getItemAsync(key);
    return typeof v === 'string' ? v : null;
  } catch {
    return null;
  }
}

export async function setStoredItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    return;
  }
}

export async function deleteStoredItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    return;
  }
}
