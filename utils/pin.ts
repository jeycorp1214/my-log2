// PIN을 expo-secure-store에 저장/조회/삭제하는 유틸리티
import * as SecureStore from "expo-secure-store";

const PIN_KEY = "app_pin";

export async function getStoredPin(): Promise<string | null> {
  return SecureStore.getItemAsync(PIN_KEY);
}

export async function savePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function deleteStoredPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}
