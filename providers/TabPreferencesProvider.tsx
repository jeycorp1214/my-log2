// 탭별 필터·뷰 설정을 전역 관리하고 SecureStore로 앱 재시작 간 유지하는 Provider
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const PREFS_KEY = "app_tab_preferences";

export type CalendarPrefs = {
  viewMode: "compact" | "board";
  showAnniversaries: boolean;
};

export type ListPrefs = {
  preset: "this-week" | "this-month" | "recent-3m" | "custom";
  completionFilter: "all" | "done" | "undone";
  typeFilter: "all" | "regular" | "repeat";
  sortOrder: "oldest" | "newest";
  groupFilter: string;
  personFilter: "all" | "yes" | "no";
  showAnniversaries: boolean;
};

export type PersonsPrefs = {
  sortOrder: "name-asc" | "age-asc" | "last-contact-asc";
  groupFilter: string;
  mbtiFilter: "all" | "yes" | "no";
  mbtiDetail: string;
};

export type MemoPrefs = {
  completionFilter: "all" | "done" | "undone";
  sortOrder: "newest" | "oldest";
  showDate: boolean;
};

export type AllTabPrefs = {
  calendar: CalendarPrefs;
  list: ListPrefs;
  persons: PersonsPrefs;
  memo: MemoPrefs;
};

const DEFAULT_PREFS: AllTabPrefs = {
  calendar: { viewMode: "compact", showAnniversaries: false },
  list: {
    preset: "this-month",
    completionFilter: "all",
    typeFilter: "all",
    sortOrder: "oldest",
    groupFilter: "all",
    personFilter: "all",
    showAnniversaries: false,
  },
  persons: {
    sortOrder: "name-asc",
    groupFilter: "all",
    mbtiFilter: "all",
    mbtiDetail: "",
  },
  memo: { completionFilter: "all", sortOrder: "newest", showDate: false },
};

type ContextValue = {
  prefs: AllTabPrefs;
  setCalendarPrefs: (p: Partial<CalendarPrefs>) => void;
  setListPrefs: (p: Partial<ListPrefs>) => void;
  setPersonsPrefs: (p: Partial<PersonsPrefs>) => void;
  setMemoPrefs: (p: Partial<MemoPrefs>) => void;
};

const TabPreferencesContext = createContext<ContextValue>({
  prefs: DEFAULT_PREFS,
  setCalendarPrefs: () => {},
  setListPrefs: () => {},
  setPersonsPrefs: () => {},
  setMemoPrefs: () => {},
});

export function TabPreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AllTabPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    SecureStore.getItemAsync(PREFS_KEY).then((v) => {
      if (!v) return;
      try {
        const parsed = JSON.parse(v) as Partial<AllTabPrefs>;
        setPrefs((prev) => ({
          calendar: { ...prev.calendar, ...parsed.calendar },
          list: { ...prev.list, ...parsed.list },
          persons: { ...prev.persons, ...parsed.persons },
          memo: { ...prev.memo, ...parsed.memo },
        }));
      } catch {}
    });
  }, []);

  const setCalendarPrefs = useCallback((p: Partial<CalendarPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, calendar: { ...prev.calendar, ...p } };
      SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setListPrefs = useCallback((p: Partial<ListPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, list: { ...prev.list, ...p } };
      SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setPersonsPrefs = useCallback((p: Partial<PersonsPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, persons: { ...prev.persons, ...p } };
      SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setMemoPrefs = useCallback((p: Partial<MemoPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, memo: { ...prev.memo, ...p } };
      SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <TabPreferencesContext.Provider
      value={{
        prefs,
        setCalendarPrefs,
        setListPrefs,
        setPersonsPrefs,
        setMemoPrefs,
      }}
    >
      {children}
    </TabPreferencesContext.Provider>
  );
}

export function useTabPreferences() {
  return useContext(TabPreferencesContext);
}
