import AsyncStorage from "@react-native-async-storage/async-storage";

export class Storage {
  static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error(`Error setting item "${key}":`, e);
    }
  }

  static async getItem<T = unknown>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
    } catch (e) {
      console.error(`Error getting item "${key}":`, e);
      return null;
    }
  }

  static async updateItem<T>(key: string, value: T): Promise<void> {
    await this.setItem(key, value);
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing item "${key}":`, e);
    }
  }

  static async getAllKeys(): Promise<readonly string[]> {
    try {
      return (await AsyncStorage.getAllKeys()) ?? [];
    } catch (e) {
      console.error("Error getting all keys:", e);
      return [];
    }
  }

  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error("Error clearing storage:", e);
    }
  }
}

export default Storage;
