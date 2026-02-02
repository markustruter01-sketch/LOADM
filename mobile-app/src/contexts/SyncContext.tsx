import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Network from 'expo-network';
import { useDatabase } from './DatabaseContext';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS, buildApiUrl, getAuthHeaders } from '../config/api';

interface SyncContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncData: () => Promise<void>;
  queueForSync: (tableName: string, recordId: number, action: 'CREATE' | 'UPDATE' | 'DELETE', data?: any) => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { db } = useDatabase();
  const { user } = useAuth();
  
  const checkNetworkStatus = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      setIsOnline(networkState.isConnected || false);
    } catch (error) {
      console.error('Network check failed:', error);
      setIsOnline(false);
    }
  };

  const queueForSync = async (
    tableName: string, 
    recordId: number, 
    action: 'CREATE' | 'UPDATE' | 'DELETE', 
    data?: any
  ): Promise<void> => {
    if (!db) return;
    
    try {
      await db.runAsync(
        'INSERT INTO sync_queue (table_name, record_id, action, data) VALUES (?, ?, ?, ?)',
        [tableName, recordId, action, JSON.stringify(data || {})]
      );
    } catch (error) {
      console.error('Failed to queue for sync:', error);
    }
  };

  const syncQuizSubmissions = async () => {
    if (!db || !user) return;

    try {
      const pendingSubmissions = await db.getAllAsync(
        'SELECT * FROM quiz_submissions WHERE synced = 0 AND user_id = ?',
        [user.id]
      );

      const headers = await getAuthHeaders();

      for (const submission of pendingSubmissions) {
        try {
          const response = await fetch(API_ENDPOINTS.QUIZ_SUBMISSIONS, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              quizId: (submission as any).quiz_id,
              answers: JSON.parse((submission as any).answers as string),
              score: (submission as any).score,
              passed: (submission as any).passed,
            }),
          });

          if (response.ok) {
            await db.runAsync(
              'UPDATE quiz_submissions SET synced = 1 WHERE id = ?',
              [(submission as any).id]
            );
          }
        } catch (error) {
          console.log('Failed to sync quiz submission:', (submission as any).id);
        }
      }
    } catch (error) {
      console.error('Quiz submissions sync failed:', error);
    }
  };

  const syncScenarioSubmissions = async () => {
    if (!db || !user) return;

    try {
      const pendingSubmissions = await db.getAllAsync(
        'SELECT * FROM scenario_submissions WHERE synced = 0 AND user_id = ?',
        [user.id]
      );

      const headers = await getAuthHeaders();

      for (const submission of pendingSubmissions) {
        try {
          const response = await fetch(API_ENDPOINTS.SCENARIO_SUBMISSIONS, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              scenarioId: (submission as any).scenario_id,
              formData: JSON.parse((submission as any).form_data as string),
              answers: JSON.parse((submission as any).answers as string),
            }),
          });

          if (response.ok) {
            await db.runAsync(
              'UPDATE scenario_submissions SET synced = 1 WHERE id = ?',
              [(submission as any).id]
            );
          }
        } catch (error) {
          console.log('Failed to sync scenario submission:', (submission as any).id);
        }
      }
    } catch (error) {
      console.error('Scenario submissions sync failed:', error);
    }
  };

  const syncUserQualifications = async () => {
    if (!db || !user) return;

    try {
      const pendingQualifications = await db.getAllAsync(
        'SELECT * FROM user_qualifications WHERE synced = 0 AND user_id = ?',
        [user.id]
      );

      const headers = await getAuthHeaders();

      for (const qual of pendingQualifications) {
        try {
          const response = await fetch(API_ENDPOINTS.USER_QUALIFICATIONS, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: (qual as any).name,
              startDate: (qual as any).start_date,
              expiryDate: (qual as any).expiry_date,
            }),
          });

          if (response.ok) {
            await db.runAsync(
              'UPDATE user_qualifications SET synced = 1 WHERE id = ?',
              [(qual as any).id]
            );
          }
        } catch (error) {
          console.log('Failed to sync qualification:', (qual as any).id);
        }
      }

      // Download latest qualifications from server
      try {
        const response = await fetch(API_ENDPOINTS.USER_QUALIFICATIONS, { headers });
        if (response.ok) {
          const qualifications = await response.json();
          for (const qual of qualifications) {
            await db.runAsync(
              `INSERT OR REPLACE INTO user_qualifications 
               (id, user_id, name, start_date, expiry_date, synced) 
               VALUES (?, ?, ?, ?, ?, 1)`,
              [qual.id, user.id, qual.name, qual.startDate, qual.expiryDate]
            );
          }
        }
      } catch (error) {
        console.log('Failed to download qualifications');
      }
    } catch (error) {
      console.error('Qualifications sync failed:', error);
    }
  };

  const syncFlightRecords = async () => {
    if (!db || !user) return;

    try {
      const pendingRecords = await db.getAllAsync(
        'SELECT * FROM flight_records WHERE synced = 0 AND user_id = ?',
        [user.id]
      );

      const headers = await getAuthHeaders();

      for (const record of pendingRecords) {
        try {
          const response = await fetch(API_ENDPOINTS.FLIGHT_RECORDS, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              date: (record as any).date,
              callsign: (record as any).callsign,
              departure: (record as any).departure,
              arrival: (record as any).arrival,
              captain: (record as any).captain,
              passengersCarried: (record as any).passengers_carried,
              cargoWeight: (record as any).cargo_weight,
              nightHours: (record as any).night_hours,
              dayHours: (record as any).day_hours,
            }),
          });

          if (response.ok) {
            await db.runAsync(
              'UPDATE flight_records SET synced = 1 WHERE id = ?',
              [(record as any).id]
            );
          }
        } catch (error) {
          console.log('Failed to sync flight record:', (record as any).id);
        }
      }

      // Download latest flight records from server
      try {
        const response = await fetch(API_ENDPOINTS.FLIGHT_RECORDS, { headers });
        if (response.ok) {
          const records = await response.json();
          for (const record of records) {
            await db.runAsync(
              `INSERT OR REPLACE INTO flight_records 
               (id, user_id, date, callsign, departure, arrival, captain, passengers_carried, cargo_weight, night_hours, day_hours, synced) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
              [
                record.id, 
                user.id, 
                record.date, 
                record.callsign, 
                record.departure, 
                record.arrival, 
                record.captain, 
                record.passengersCarried, 
                record.cargoWeight, 
                record.nightHours, 
                record.dayHours
              ]
            );
          }
        }
      } catch (error) {
        console.log('Failed to download flight records');
      }
    } catch (error) {
      console.error('Flight records sync failed:', error);
    }
  };

  const syncChatMessages = async () => {
    if (!db || !user) return;

    try {
      const pendingMessages = await db.getAllAsync(
        'SELECT * FROM chat_messages WHERE synced = 0 AND user_id = ?',
        [user.id]
      );

      const headers = await getAuthHeaders();

      for (const message of pendingMessages) {
        try {
          const response = await fetch(API_ENDPOINTS.CHAT, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              message: (message as any).message,
              timestamp: (message as any).timestamp,
            }),
          });

          if (response.ok) {
            await db.runAsync(
              'UPDATE chat_messages SET synced = 1 WHERE id = ?',
              [(message as any).id]
            );
          }
        } catch (error) {
          console.log('Failed to sync chat message:', (message as any).id);
        }
      }

      // Also fetch new messages from server
      const response = await fetch(API_ENDPOINTS.CHAT, { headers });
      if (response.ok) {
        const messages = await response.json();
        for (const msg of messages) {
          await db.runAsync(
            `INSERT OR REPLACE INTO chat_messages 
             (id, user_id, message, timestamp, synced) 
             VALUES (?, ?, ?, ?, 1)`,
            [msg.id, msg.userId, msg.message, msg.timestamp]
          );
        }
      }
    } catch (error) {
      console.error('Chat messages sync failed:', error);
    }
  };

  const downloadLatestData = async () => {
    if (!db) return;

    try {
      const headers = await getAuthHeaders();

      // Download latest quizzes
      const quizzesResponse = await fetch(API_ENDPOINTS.QUIZZES, { headers });
      if (quizzesResponse.ok) {
        const quizzes = await quizzesResponse.json();
        for (const quiz of quizzes) {
          await db.runAsync(
            `INSERT OR REPLACE INTO quizzes 
             (id, title, description, question_count, passing_threshold, categories, is_active, created_by, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              quiz.id,
              quiz.title,
              quiz.description,
              quiz.questionCount,
              quiz.passingThreshold,
              JSON.stringify(quiz.categories),
              quiz.isActive ? 1 : 0,
              quiz.createdBy,
              quiz.createdAt,
              quiz.updatedAt
            ]
          );
        }
      }

      // Download latest scenarios
      const scenariosResponse = await fetch(API_ENDPOINTS.SCENARIOS, { headers });
      if (scenariosResponse.ok) {
        const scenarios = await scenariosResponse.json();
        for (const scenario of scenarios) {
          await db.runAsync(
            `INSERT OR REPLACE INTO scenarios 
             (id, title, description, form_fields, questions, passing_threshold, is_active, created_by, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              scenario.id,
              scenario.title,
              scenario.description,
              JSON.stringify(scenario.formFields),
              JSON.stringify(scenario.questions),
              scenario.passingThreshold,
              scenario.isActive ? 1 : 0,
              scenario.createdBy,
              scenario.createdAt,
              scenario.updatedAt
            ]
          );
        }
      }

      // Download documents list
      const documentsResponse = await fetch(API_ENDPOINTS.DOCUMENTS, { headers });
      if (documentsResponse.ok) {
        const documents = await documentsResponse.json();
        for (const doc of documents) {
          await db.runAsync(
            `INSERT OR REPLACE INTO documents 
             (id, title, filename, file_path, file_size, content_type, is_active, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              doc.id,
              doc.title,
              doc.filename,
              doc.filePath,
              doc.fileSize,
              doc.contentType,
              doc.isActive ? 1 : 0,
              doc.createdAt
            ]
          );
        }
      }
    } catch (error) {
      console.error('Download latest data failed:', error);
    }
  };

  const syncData = async (): Promise<void> => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      // Upload pending data
      await syncQuizSubmissions();
      await syncScenarioSubmissions();
      await syncUserQualifications();
      await syncFlightRecords();
      await syncChatMessages();
      
      // Download latest data
      await downloadLatestData();
      
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Check network status on mount and set up listener
  useEffect(() => {
    checkNetworkStatus();
    
    const interval = setInterval(checkNetworkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && user) {
      syncData();
    }
  }, [isOnline, user]);

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        isSyncing,
        lastSyncTime,
        syncData,
        queueForSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
