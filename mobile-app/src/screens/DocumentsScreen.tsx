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

interface Props {
  navigation: any;
}

interface Document {
  id: number;
  title: string;
  filename: string;
  file_size: number;
  content_type: string;
}

const DocumentsScreen: React.FC<Props> = ({ navigation }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { db } = useDatabase();

  useEffect(() => {
    loadDocuments();
  }, [db]);

  const loadDocuments = async () => {
    if (!db) return;
    
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM documents WHERE is_active = 1 ORDER BY title ASC'
      );
      setDocuments(result as Document[]);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDocument = (document: Document) => {
    Alert.alert(
      'Open Document',
      `Would you like to open "${document.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open', 
          onPress: () => {
            Alert.alert('Coming Soon', 'PDF viewer will be available in the next update!');
          }
        },
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
        <Text style={styles.subtitle}>
          Technical manuals and training materials
        </Text>
      </View>

      {documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>No documents available</Text>
          <Text style={styles.emptySubtext}>
            Sync with the server to download documents
          </Text>
        </View>
      ) : (
        <View style={styles.documentsList}>
          {documents.map((document) => (
            <TouchableOpacity
              key={document.id}
              style={styles.documentCard}
              onPress={() => openDocument(document)}
            >
              <View style={styles.documentIcon}>
                <Text style={styles.iconText}>📄</Text>
              </View>
              
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle}>{document.title}</Text>
                <Text style={styles.documentFilename}>{document.filename}</Text>
                <Text style={styles.documentSize}>
                  {formatFileSize(document.file_size)}
                </Text>
              </View>
              
              <View style={styles.openButton}>
                <Text style={styles.openButtonText}>Open</Text>
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
  documentsList: {
    padding: 20,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  documentIcon: {
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  documentFilename: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  documentSize: {
    fontSize: 10,
    color: '#9ca3af',
  },
  openButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  openButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default DocumentsScreen;