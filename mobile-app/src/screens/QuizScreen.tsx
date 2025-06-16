import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { theme } from '../theme';

interface Props {
  navigation: any;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  question_count: number;
  passing_threshold: number;
}

const QuizScreen: React.FC<Props> = ({ navigation }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { db } = useDatabase();
  const { user } = useAuth();
  const { queueForSync } = useSync();

  useEffect(() => {
    loadQuizzes();
  }, [db]);

  const loadQuizzes = async () => {
    if (!db) return;
    
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM quizzes WHERE is_active = 1 ORDER BY created_at DESC'
      );
      setQuizzes(result as Quiz[]);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = (quiz: Quiz) => {
    Alert.alert(
      'Start Quiz',
      `Are you ready to start "${quiz.title}"?\n\nQuestions: ${quiz.question_count}\nPassing Score: ${quiz.passing_threshold}%`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: () => {
            // Navigate to quiz taking screen
            navigation.navigate('TakeQuiz', { quizId: quiz.id });
          }
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading quizzes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Quizzes</Text>
        <Text style={styles.subtitle}>
          Test your knowledge with these training quizzes
        </Text>
      </View>

      {quizzes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No quizzes available</Text>
          <Text style={styles.emptySubtext}>
            Sync with the server to download the latest quizzes
          </Text>
        </View>
      ) : (
        <View style={styles.quizList}>
          {quizzes.map((quiz) => (
            <TouchableOpacity
              key={quiz.id}
              style={styles.quizCard}
              onPress={() => startQuiz(quiz)}
            >
              <Text style={styles.quizTitle}>{quiz.title}</Text>
              <Text style={styles.quizDescription}>{quiz.description}</Text>
              
              <View style={styles.quizMeta}>
                <Text style={styles.metaText}>
                  {quiz.question_count} questions
                </Text>
                <Text style={styles.metaText}>
                  {quiz.passing_threshold}% to pass
                </Text>
              </View>
              
              <View style={styles.startButton}>
                <Text style={styles.startButtonText}>Start Quiz</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  quizList: {
    padding: 20,
  },
  quizCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  quizDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  quizMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default QuizScreen;