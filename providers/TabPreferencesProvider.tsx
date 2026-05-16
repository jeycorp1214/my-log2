// 탭별 필터·뷰 설정을 전역 관리하고 파일로 앱 재시작 간 유지하는 Provider
import * as FileSystem from "expo-file-system/legacy";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const PREFS_PATH = `${FileSystem.documentDirectory}tab_preferences.json`;

async function readPrefs(): Promise<string | null> {
  try {
    return await FileSystem.readAsStringAsync(PREFS_PATH, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch {
    return null;
  }
}

async function writePrefs(data: string): Promise<void> {
  await FileSystem.writeAsStringAsync(PREFS_PATH, data, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

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

export type HomePrefs = {
  showMonthSummary: boolean;
  showStreak: boolean;
  showUpcomingAnn: boolean;
  showTodayRepeat: boolean;
  showOverduePersons: boolean;
  showPinnedMemos: boolean;
  showTodoStatus: boolean;
  showMiniHeatmap: boolean;
  showCategoryRatio: boolean;
  showRecentLogs: boolean;
};

export type AllTabPrefs = {
  calendar: CalendarPrefs;
  list: ListPrefs;
  persons: PersonsPrefs;
  memo: MemoPrefs;
  home: HomePrefs;
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
  home: {
    showMonthSummary: true,
    showStreak: true,
    showUpcomingAnn: true,
    showTodayRepeat: false,
    showOverduePersons: false,
    showPinnedMemos: false,
    showTodoStatus: false,
    showMiniHeatmap: false,
    showCategoryRatio: false,
    showRecentLogs: true,
  },
};

type ContextValue = {
  prefs: AllTabPrefs;
  setCalendarPrefs: (p: Partial<CalendarPrefs>) => void;
  setListPrefs: (p: Partial<ListPrefs>) => void;
  setPersonsPrefs: (p: Partial<PersonsPrefs>) => void;
  setMemoPrefs: (p: Partial<MemoPrefs>) => void;
  setHomePrefs: (p: Partial<HomePrefs>) => void;
};

const TabPreferencesContext = createContext<ContextValue>({
  prefs: DEFAULT_PREFS,
  setCalendarPrefs: () => {},
  setListPrefs: () => {},
  setPersonsPrefs: () => {},
  setMemoPrefs: () => {},
  setHomePrefs: () => {},
});

export function TabPreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AllTabPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    readPrefs().then((v) => {
      if (!v) return;
      try {
        const parsed = JSON.parse(v) as Partial<AllTabPrefs>;
        setPrefs((prev) => ({
          calendar: { ...prev.calendar, ...parsed.calendar },
          list: { ...prev.list, ...parsed.list },
          persons: { ...prev.persons, ...parsed.persons },
          memo: { ...prev.memo, ...parsed.memo },
          home: { ...prev.home, ...parsed.home },
        }));
      } catch {}
    });
  }, []);

  const setCalendarPrefs = useCallback((p: Partial<CalendarPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, calendar: { ...prev.calendar, ...p } };
      writePrefs(JSON.stringify(next));
      return next;
    });
  }, []);

  const setListPrefs = useCallback((p: Partial<ListPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, list: { ...prev.list, ...p } };
      writePrefs(JSON.stringify(next));
      return next;
    });
  }, []);

  const setPersonsPrefs = useCallback((p: Partial<PersonsPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, persons: { ...prev.persons, ...p } };
      writePrefs(JSON.stringify(next));
      return next;
    });
  }, []);

  const setMemoPrefs = useCallback((p: Partial<MemoPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, memo: { ...prev.memo, ...p } };
      writePrefs(JSON.stringify(next));
      return next;
    });
  }, []);

  const setHomePrefs = useCallback((p: Partial<HomePrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, home: { ...prev.home, ...p } };
      writePrefs(JSON.stringify(next));
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
        setHomePrefs,
      }}
    >
      {children}
    </TabPreferencesContext.Provider>
  );
}

export function useTabPreferences() {
  return useContext(TabPreferencesContext);
}
