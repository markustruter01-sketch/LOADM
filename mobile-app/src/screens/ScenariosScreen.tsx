import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { OfflineDataService } from '../services/OfflineDataService';

interface Props {
  navigation: any;
}

interface Scenario {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  estimated_duration: number;
  form_fields: string;
  questions: string;
  is_active: number;
}

interface ScenarioSubmission {
  id: number;
  scenario_id: number;
  user_id: number;
  form_data: string;
  answers: string;
  score: number;
  passed: number;
  submitted_at: string;
  scenario_title?: string;
}

const ScenariosScreen: React.FC<Props> = ({ navigation }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [submissions, setSubmissions] = useState<ScenarioSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { db } = useDatabase();
  const { user } = useAuth();
  const { queueForSync, isOnline } = useSync();

  useEffect(() => {
    loadData();
  }, [db]);

  const loadData = async () => {
    if (!db) return;

    try {
      const dataService = new OfflineDataService(db);
      
      // Load scenarios
      const scenariosData = await dataService.getScenarios();
      setScenarios(scenariosData);

      // Load user submissions
      if (user) {
        const submissionsData = await db.getAllAsync(
          `SELECT ss.*, s.title as scenario_title 
           FROM scenario_submissions ss 
           JOIN scenarios s ON ss.scenario_id = s.id 
           WHERE ss.user_id = ? 
           ORDER BY ss.submitted_at DESC`,
          [user.id]
        );
        setSubmissions(submissionsData as ScenarioSubmission[]);
      }
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setFormData({});
    setAnswers({});
    setShowScenarioModal(true);
  };

  const submitScenario = async () => {
    if (!selectedScenario || !db || !user) return;

    // Validate required fields
    const formFields = JSON.parse(selectedScenario.form_fields || '[]');
    const questions = JSON.parse(selectedScenario.questions || '[]');

    const missingFields = formFields.filter((field: any) => 
      field.required && !formData[field.id]
    );

    const missingAnswers = questions.filter((question: any) => 
      !answers[question.id]
    );

    if (missingFields.length > 0 || missingAnswers.length > 0) {
      Alert.alert(
        'Incomplete Submission',
        'Please fill in all required fields and answer all questions.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const dataService = new OfflineDataService(db);
      
      // Calculate score for multiple choice questions
      let score = 0;
      let totalQuestions = 0;

      questions.forEach((question: any) => {
        if (question.questionType === 'multiple-choice') {
          totalQuestions++;
          if (answers[question.id] === question.correctAnswer) {
            score++;
          }
        }
      });

      const finalScore = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 100;
      const passed = finalScore >= 70;

      await dataService.saveScenarioSubmission({
        scenarioId: selectedScenario.id,
        userId: user.id,
        formData,
        answers,
        score: finalScore,
        passed,
      });

      await queueForSync('scenario_submissions', selectedScenario.id, 'CREATE', {
        scenarioId: selectedScenario.id,
        formData,
        answers,
        score: finalScore,
        passed,
      });

      Alert.alert(
        'Scenario Complete!',
        `Your submission has been saved.\nScore: ${finalScore}%\nStatus: ${passed ? 'PASSED' : 'NEEDS REVIEW'}\n\nThis will sync when you're online.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowScenarioModal(false);
              setSelectedScenario(null);
              loadData();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to submit scenario:', error);
      Alert.alert('Error', 'Failed to submit scenario. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderFormField = (field: any) => {
    switch (field.type) {
      case 'text':
      case 'textarea':
        return (
          <TextInput
            key={field.id}
            style={[styles.textInput, field.type === 'textarea' && styles.textArea]}
            placeholder={field.placeholder || field.label}
            value={formData[field.id] || ''}
            onChangeText={(text) => setFormData({ ...formData, [field.id]: text })}
            multiline={field.type === 'textarea'}
            numberOfLines={field.type === 'textarea' ? 4 : 1}
          />
        );
      case 'select':
        return (
          <View key={field.id} style={styles.selectContainer}>
            {field.options?.map((option: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.selectOption,
                  formData[field.id] === option && styles.selectedOption,
                ]}
                onPress={() => setFormData({ ...formData, [field.id]: option })}
              >
                <Text style={[
                  styles.selectOptionText,
                  formData[field.id] === option && styles.selectedOptionText,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  const renderQuestion = (question: any) => {
    if (question.questionType === 'multiple-choice') {
      return (
        <View key={question.id} style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.question}</Text>
          <View style={styles.optionsContainer}>
            {question.options.map((option: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  answers[question.id] === option && styles.selectedAnswer,
                ]}
                onPress={() => setAnswers({ ...answers, [question.id]: option })}
              >
                <Text style={[
                  styles.optionText,
                  answers[question.id] === option && styles.selectedAnswerText,
                ]}>
                  {String.fromCharCode(65 + index)}. {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    } else {
      return (
        <View key={question.id} style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.question}</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Enter your answer..."
            value={answers[question.id] || ''}
            onChangeText={(text) => setAnswers({ ...answers, [question.id]: text })}
            multiline
            numberOfLines={4}
          />
        </View>
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading scenarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Training Scenarios</Text>
        <View style={[styles.statusDot, isOnline ? styles.online : styles.offline]} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Available ({scenarios.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed ({submissions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'available' ? (
          <>
            {scenarios.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No scenarios available</Text>
                <Text style={styles.emptySubtext}>
                  Check back later for new training scenarios.
                </Text>
              </View>
            ) : (
              scenarios.map((scenario) => (
                <View key={scenario.id} style={styles.scenarioCard}>
                  <View style={styles.scenarioHeader}>
                    <Text style={styles.scenarioTitle}>{scenario.title}</Text>
                    <View style={styles.scenarioMeta}>
                      <Text style={[styles.difficultyBadge, { color: getDifficultyColor(scenario.difficulty) }]}>
                        {scenario.difficulty}
                      </Text>
                      <Text style={styles.durationText}>
                        {formatDuration(scenario.estimated_duration)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.scenarioDescription}>{scenario.description}</Text>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => startScenario(scenario)}
                  >
                    <Text style={styles.startButtonText}>Start Scenario</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            {submissions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>No completed scenarios</Text>
                <Text style={styles.emptySubtext}>
                  Complete some scenarios to see your results here.
                </Text>
              </View>
            ) : (
              submissions.map((submission) => (
                <View key={submission.id} style={styles.submissionCard}>
                  <Text style={styles.submissionTitle}>{submission.scenario_title}</Text>
                  <View style={styles.submissionDetails}>
                    <Text style={styles.submissionScore}>
                      Score: {submission.score}%
                    </Text>
                    <Text style={[
                      styles.submissionStatus,
                      { color: submission.passed ? '#10b981' : '#f59e0b' }
                    ]}>
                      {submission.passed ? 'PASSED' : 'NEEDS REVIEW'}
                    </Text>
                  </View>
                  <Text style={styles.submissionDate}>
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Scenario Modal */}
      {showScenarioModal && selectedScenario && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalTitle}>{selectedScenario.title}</Text>
              <Text style={styles.modalDescription}>{selectedScenario.description}</Text>

              {/* Form Fields */}
              {JSON.parse(selectedScenario.form_fields || '[]').map((field: any) => (
                <View key={field.id} style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>
                    {field.label} {field.required && <Text style={styles.required}>*</Text>}
                  </Text>
                  {renderFormField(field)}
                </View>
              ))}

              {/* Questions */}
              {JSON.parse(selectedScenario.questions || '[]').map((question: any) =>
                renderQuestion(question)
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowScenarioModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={submitScenario}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  online: {
    backgroundColor: '#10b981',
  },
  offline: {
    backgroundColor: '#ef4444',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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
  scenarioCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  scenarioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    flex: 1,
    marginRight: 16,
  },
  scenarioMeta: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#6b7280',
  },
  scenarioDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submissionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  submissionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  submissionScore: {
    fontSize: 14,
    color: '#6b7280',
  },
  submissionStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  submissionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalScroll: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedOption: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedOptionText: {
    color: '#1e40af',
    fontWeight: '500',
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedAnswer: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedAnswerText: {
    color: '#1e40af',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ScenariosScreen;