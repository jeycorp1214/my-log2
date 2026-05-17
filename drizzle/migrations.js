// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_windy_bruce_banner.sql';
import m0001 from './0001_add_checked_at.sql';
import m0002 from './0002_person_anniversaries.sql';
import m0003 from './0003_add_memos.sql';
import m0004 from './0004_add_todos.sql';
import m0005 from './0005_add_is_pinned.sql';
import m0006 from './0006_add_contact_interval.sql';
import m0007 from './0007_add_tags_and_met_at.sql';
import m0008 from './0008_add_memo_pinned_at.sql';
import m0009 from './0009_add_todo_due_date.sql';
import m0010 from './0010_add_is_system.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006,
m0007,
m0008,
m0009,
m0010
    }
  }
