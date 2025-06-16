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
import { OfflineDataService } from '../services/OfflineDataService';

interface Props {
  navigation: any;
  route: {
    params: {
      quizId: number;
    };
  };
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string;
  correct_answer: number;
  category: string;
  difficulty: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  question_count: number;
  passing_threshold: number;
}

const TakeQuizScreen: React.FC<Props> = ({ navigation, route }) => {
  const { quizId } = route.params;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  const { db } = useDatabase();
  const { user } = useAuth();
  const { queueForSync } = useSync();

  useEffect(() => {
    loadQuizData();
  }, [db, quizId]);

  useEffect(() => {
    // Start timer if quiz has time limit (30 minutes default)
    if (questions.length > 0 && timeRemaining === null) {
      setTimeRemaining(30 * 60); // 30 minutes in seconds
    }
  }, [questions]);

  useEffect(() => {
    // Timer countdown
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleAutoSubmit();
    }
  }, [timeRemaining]);

  const loadQuizData = async () => {
    if (!db) return;

    try {
      const dataService = new OfflineDataService(db);
      
      // Load quiz details
      const quizResult = await db.getFirstAsync(
        'SELECT * FROM quizzes WHERE id = ?',
        [quizId]
      );
      
      if (!quizResult) {
        Alert.alert('Error', 'Quiz not found');
        navigation.goBack();
        return;
      }

      setQuiz(quizResult as Quiz);

      // Load quiz questions
      const questionsResult = await dataService.getQuizQuestions(quizId);
      if (questionsResult.length === 0) {
        Alert.alert('Error', 'No questions found for this quiz');
        navigation.goBack();
        return;
      }

      setQuestions(questionsResult);
    } catch (error) {
      console.error('Failed to load quiz data:', error);
      Alert.alert('Error', 'Failed to load quiz');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]: answerIndex,
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = (): { score: number; passed: boolean } => {
    let correctAnswers = 0;
    
    questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= (quiz?.passing_threshold || 70);

    return { score, passed };
  };

  const handleSubmitQuiz = () => {
    const unansweredCount = questions.length - Object.keys(answers).length;
    
    if (unansweredCount > 0) {
      Alert.alert(
        'Incomplete Quiz',
        `You have ${unansweredCount} unanswered question(s). Submit anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: submitQuiz },
        ]
      );
    } else {
      submitQuiz();
    }
  };

  const handleAutoSubmit = () => {
    Alert.alert(
      'Time Up!',
      'The quiz time limit has been reached. Your quiz will be submitted automatically.',
      [{ text: 'OK', onPress: submitQuiz }]
    );
  };

  const submitQuiz = async () => {
    if (!db || !user || !quiz) return;

    setIsSubmitting(true);
    try {
      const dataService = new OfflineDataService(db);
      const { score, passed } = calculateScore();

      await dataService.saveQuizSubmission({
        quizId: quiz.id,
        userId: user.id,
        answers,
        score,
        passed,
      });

      await queueForSync('quiz_submissions', quiz.id, 'CREATE', {
        quizId: quiz.id,
        answers,
        score,
        passed,
      });

      Alert.alert(
        'Quiz Complete!',
        `Your score: ${score}%\nResult: ${passed ? 'PASSED' : 'FAILED'}\n\nYour submission has been saved and will sync when online.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Quiz'),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Quiz not available</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentOptions = JSON.parse(currentQuestion.options);
  const selectedAnswer = answers[currentQuestionIndex];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.quizTitle}>{quiz.title}</Text>
        {timeRemaining !== null && (
          <Text style={[styles.timer, timeRemaining < 300 && styles.timerWarning]}>
            {formatTime(timeRemaining)}
          </Text>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} 
          />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
      </View>

      {/* Question */}
      <ScrollView style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        
        <View style={styles.optionsContainer}>
          {currentOptions.map((option: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === index && styles.selectedOption,
              ]}
              onPress={() => handleAnswerSelect(index)}
            >
              <View style={styles.optionRow}>
                <View style={[
                  styles.optionRadio,
                  selectedAnswer === index && styles.selectedRadio,
                ]}>
                  {selectedAnswer === index && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  selectedAnswer === index && styles.selectedOptionText,
                ]}>
                  {String.fromCharCode(65 + index)}. {option}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.questionMeta}>
          <Text style={styles.metaText}>
            Category: {currentQuestion.category}
          </Text>
          <Text style={styles.metaText}>
            Difficulty: {currentQuestion.difficulty}
          </Text>
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
          onPress={previousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        {currentQuestionIndex === questions.length - 1 ? (
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmitQuiz}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Quiz</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navButton}
            onPress={nextQuestion}
          >
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    flex: 1,
  },
  timer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timerWarning: {
    color: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  questionContainer: {
    flex: 1,
    padding: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 26,
    marginBottom: 24,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    borderColor: '#3b82f6',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  selectedOptionText: {
    color: '#1e40af',
    fontWeight: '500',
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#f9fafb',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  navButtonTextDisabled: {
    color: '#9ca3af',
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default TakeQuizScreen;