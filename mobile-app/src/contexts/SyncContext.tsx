import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Network from 'expo-network';
import { useDatabase } from './DatabaseContext';
import { useAuth } from './AuthContext';

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

      for (const submission of pendingSubmissions) {
        try {
          const response = await fetch('http://localhost:5000/api/quiz-submissions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quizId: submission.quiz_id,
              answers: JSON.parse(submission.answers as string),
              score: submission.score,
              passed: submission.passed,
            }),
          });

          if (response.ok) {
            await db.runAsync(
              'UPDATE quiz_submissions SET synced = 1 WHERE id = ?',
              [submission.id]
            );
          }
        } catch (error) {
          console.log('Failed to sync quiz submission:', submission.id);
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

      for (const submission of pendingSubmissions) {
        try {
          const response = await fetch('http://localhost:5000/api/scenario-submissions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              scenarioId: submission.scenario_id,
              formData: JSON.parse(submission.form_data as string),
              answers: JSON.parse(submission.answers as string),
            }),
          });

          if (response.ok) {
            await db.runAsync(
              'UPDATE scenario_submissions SET synced = 1 WHERE id = ?',
              [submission.id]
            );
          }
        } catch (error) {
          console.log('Failed to sync scenario submission:', submission.id);
        }
      }
    } catch (error) {
      console.error('Scenario submissions sync failed:', error);
    }
  };

  const syncChatMessages = async () => {
    if (!db || !user) return;

    try {
      const pendingMessages = await db.getAllAsync(
        'SELECT * FROM chat_messages WHERE synced = 0 AND user_id = ?',
        [user.id]
      );

      for (const message of pendingMessages) {
        try {
          const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: message.message,
              timestamp: message.timestamp,
            }),
          });

          if (response.ok) {
            await db.runAsync(
              'UPDATE chat_messages SET synced = 1 WHERE id = ?',
              [message.id]
            );
          }
        } catch (error) {
          console.log('Failed to sync chat message:', message.id);
        }
      }

      // Also fetch new messages from server
      const response = await fetch('http://localhost:5000/api/chat');
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
      // Download latest quizzes
      const quizzesResponse = await fetch('http://localhost:5000/api/quizzes');
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
      const scenariosResponse = await fetch('http://localhost:5000/api/scenarios');
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
      const documentsResponse = await fetch('http://localhost:5000/api/documents');
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