// PIN 잠금 활성화 여부와 잠금 상태를 전역 관리하는 Provider
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { deleteStoredPin, getStoredPin, savePin } from "@/utils/pin";

type PinLockContextValue = {
  isLocked: boolean;
  isPinEnabled: boolean;
  unlock: () => void;
  enablePin: (pin: string) => Promise<void>;
  disablePin: () => Promise<void>;
  changePin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
};

const PinLockContext = createContext<PinLockContextValue>({
  isLocked: false,
  isPinEnabled: false,
  unlock: () => {},
  enablePin: async () => {},
  disablePin: async () => {},
  changePin: async () => {},
  verifyPin: async () => false,
});

export function PinLockProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [isPinEnabled, setIsPinEnabled] = useState(false);

  useEffect(() => {
    getStoredPin().then((pin) => {
      if (pin) {
        setIsPinEnabled(true);
        setIsLocked(true);
      }
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

  return (
    <PinLockContext.Provider
      value={{ isLocked, isPinEnabled, unlock, enablePin, disablePin, changePin, verifyPin }}
    >
      {children}
    </PinLockContext.Provider>
  );
}

export function usePinLock() {
  return useContext(PinLockContext);
}
