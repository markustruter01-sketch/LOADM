import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';

interface DatabaseContextValue {
  db: SQLite.SQLiteDatabase | null;
  isInitialized: boolean;
  initializeDatabase: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeDatabase = async () => {
    try {
      const database = await SQLite.openDatabaseAsync('loadmworkflow.db');
      
      // Create tables for offline storage
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          first_name TEXT,
          last_name TEXT,
          role TEXT NOT NULL,
          squadron TEXT,
          category TEXT,
          is_active BOOLEAN DEFAULT 1,
          has_completed_onboarding BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_qualifications (
          id INTEGER PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          start_date DATE NOT NULL,
          expiry_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced BOOLEAN DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS flight_records (
          id INTEGER PRIMARY KEY,
          user_id INTEGER NOT NULL,
          date DATE NOT NULL,
          callsign TEXT,
          departure TEXT NOT NULL,
          arrival TEXT NOT NULL,
          captain TEXT NOT NULL,
          passengers_carried INTEGER DEFAULT 0,
          cargo_weight REAL DEFAULT 0,
          night_hours REAL DEFAULT 0,
          day_hours REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced BOOLEAN DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quizzes (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          question_count INTEGER DEFAULT 0,
          passing_threshold INTEGER DEFAULT 70,
          categories TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS quiz_questions (
          id INTEGER PRIMARY KEY,
          quiz_id INTEGER,
          question TEXT NOT NULL,
          options TEXT,
          correct_answer INTEGER,
          category TEXT,
          difficulty TEXT DEFAULT 'medium',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
        );

        CREATE TABLE IF NOT EXISTS quiz_submissions (
          id INTEGER PRIMARY KEY,
          quiz_id INTEGER,
          user_id INTEGER,
          answers TEXT,
          score INTEGER,
          passed BOOLEAN,
          submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced BOOLEAN DEFAULT 0,
          FOREIGN KEY (quiz_id) REFERENCES quizzes (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS scenarios (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          form_fields TEXT,
          questions TEXT,
          passing_threshold INTEGER DEFAULT 70,
          is_active BOOLEAN DEFAULT 1,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS scenario_submissions (
          id INTEGER PRIMARY KEY,
          scenario_id INTEGER,
          user_id INTEGER,
          form_data TEXT,
          answers TEXT,
          score INTEGER,
          passed BOOLEAN,
          feedback TEXT,
          submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced BOOLEAN DEFAULT 0,
          FOREIGN KEY (scenario_id) REFERENCES scenarios (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          filename TEXT,
          file_path TEXT,
          file_size INTEGER,
          content_type TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS load_plans (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          aircraft_type TEXT NOT NULL,
          cargo_data TEXT,
          balance_data TEXT,
          user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced BOOLEAN DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          message TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          synced BOOLEAN DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY,
          table_name TEXT NOT NULL,
          record_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      setDb(database);
      setIsInitialized(true);
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  };

  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isInitialized, initializeDatabase }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};