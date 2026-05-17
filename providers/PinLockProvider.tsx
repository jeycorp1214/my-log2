// PIN 잠금 활성화 여부와 잠금 상태를 전역 관리하는 Provider
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  deleteStoredPin,
  getPinLength,
  getStoredPin,
  savePin,
  savePinLength,
} from "@/utils/pin";

type PinLockContextValue = {
  isLocked: boolean;
  isPinEnabled: boolean;
  pinLength: 4 | 6;
  unlock: () => void;
  enablePin: (pin: string) => Promise<void>;
  disablePin: () => Promise<void>;
  changePin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  updatePinLength: (length: 4 | 6) => Promise<void>;
};

const PinLockContext = createContext<PinLockContextValue>({
  isLocked: false,
  isPinEnabled: false,
  pinLength: 6,
  unlock: () => {},
  enablePin: async () => {},
  disablePin: async () => {},
  changePin: async () => {},
  verifyPin: async () => false,
  updatePinLength: async () => {},
});

export function PinLockProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [pinLength, setPinLength] = useState<4 | 6>(6);

  useEffect(() => {
    Promise.all([getStoredPin(), getPinLength()]).then(([pin, length]) => {
      if (pin) {
        setIsPinEnabled(true);
        setIsLocked(true);
      }
      setPinLength(length);
    });
  }, []);

  function unlock() {
    setIsLocked(false);
  }

  async function enablePin(pin: string) {
    await savePin(pin);
    setIsPinEnabled(true);
  }

  async function disablePin() {
    await deleteStoredPin();
    setIsPinEnabled(false);
  }

  async function changePin(pin: string) {
    await savePin(pin);
  }

  async function verifyPin(pin: string): Promise<boolean> {
    const stored = await getStoredPin();
    return stored === pin;
  }

  async function updatePinLength(length: 4 | 6) {
    await savePinLength(length);
    setPinLength(length);
  }

  return (
    <PinLockContext.Provider
      value={{
        isLocked,
        isPinEnabled,
        pinLength,
        unlock,
        enablePin,
        disablePin,
        changePin,
        verifyPin,
        updatePinLength,
      }}
    >
      {children}
    </PinLockContext.Provider>
  );
}

export function usePinLock() {
  return useContext(PinLockContext);
}
