import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';

import AIService from './src/services/aiService';
import StatusIndicator from './src/components/StatusIndicator';
import ProgressBar from './src/components/ProgressBar';
import Terminal from './src/components/Terminal';
import {
  SDKStatus,
  ModelDownloadProgress,
  AgentThought,
  ChatMessage,
  DevSecOpsEvent,
} from './src/types';

const SAMPLE_DEVSECOPS_LOG: DevSecOpsEvent = {
  timestamp: '2026-02-20T10:30:45Z',
  level: 'ERROR',
  service: 'auth-service',
  event: 'authentication_failed',
  details: 'Multiple failed login attempts detected for user: admin@company.com from IP: 192.168.1.100',
  metadata: {
    attempts: 5,
    timeWindow: '2m',
    sourceIP: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    endpoint: '/api/v1/auth/login',
  },
};

const App: React.FC = () => {
  const [sdkStatus, setSdkStatus] = useState<SDKStatus>({
    initialized: false,
    modelsLoaded: [],
  });
  const [downloadProgress, setDownloadProgress] = useState<ModelDownloadProgress | null>(null);
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Set up event handlers
    AIService.onStatusChange = setSdkStatus;
    AIService.onProgressUpdate = setDownloadProgress;
    AIService.onThoughtAdded = (thought: AgentThought) => {
      setThoughts(prevThoughts => [...prevThoughts, thought]);
    };

    // Auto-initialize on app start
    initializeSDK();

    return () => {
      // Cleanup event handlers
      AIService.onStatusChange = undefined;
      AIService.onProgressUpdate = undefined;
      AIService.onThoughtAdded = undefined;
    };
  }, []);

  const initializeSDK = async () => {
    if (isInitializing) return;

    setIsInitializing(true);
    setThoughts([]);

    try {
      // Initialize SDK
      const initResult = await AIService.initialize();
      if (!initResult.success) {
        Alert.alert('Initialization Failed', initResult.error || 'Unknown error');
        return;
      }

      // Download model
      await AIService.downloadModel();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleVibeCheck = async () => {
    if (!AIService.isModelReady()) {
      Alert.alert('Model Not Ready', 'Please wait for the model to finish downloading.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult('');

    try {
      // Create chat messages for the log analysis
      const systemMessage: ChatMessage = {
        role: 'system',
        content: 'You are CodeJanitor, an AI-powered DevSecOps security analyst. Analyze the provided log entry and provide a comprehensive security assessment including severity, potential threats, and actionable recommendations.',
      };

      const userMessage: ChatMessage = {
        role: 'user',
        content: `Analyze this DevSecOps log entry for security implications:\n\n${JSON.stringify(SAMPLE_DEVSECOPS_LOG, null, 2)}`,
      };

      const response = await AIService.chat([systemMessage, userMessage]);

      if (response.success && response.response) {
        setAnalysisResult(response.response);
      } else {
        Alert.alert('Analysis Failed', response.error || 'Unknown error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isModelReady = downloadProgress?.status === 'completed';
  const showProgress = downloadProgress && downloadProgress.status === 'downloading';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={false}
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>CodeJanitor</Text>
        <Text style={styles.subtitle}>AI-Powered DevSecOps Security Auditor</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <StatusIndicator status={sdkStatus} modelReady={isModelReady} />

        {/* Progress Section */}
        {showProgress && (
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Model Download</Text>
            <ProgressBar 
              progress={downloadProgress.progress}
              showPercentage={true}
            />
            <Text style={styles.progressText}>
              {Math.round(downloadProgress.downloadedBytes / 1024 / 1024)}MB / {Math.round(downloadProgress.totalBytes / 1024 / 1024)}MB
            </Text>
          </View>
        )}

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Security Analysis</Text>
          
          <TouchableOpacity
            style={[
              styles.vibeCheckButton,
              (!isModelReady || isAnalyzing) && styles.buttonDisabled,
            ]}
            onPress={handleVibeCheck}
            disabled={!isModelReady || isAnalyzing}
          >
            <Text style={styles.buttonText}>
              {isAnalyzing ? '⟳ Analyzing...' : '🔍 Vibe Check'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.logPreview}>
            Sample Log: {SAMPLE_DEVSECOPS_LOG.level} | {SAMPLE_DEVSECOPS_LOG.service} | {SAMPLE_DEVSECOPS_LOG.event}
          </Text>
        </View>

        {/* Analysis Results */}
        {analysisResult && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Security Assessment</Text>
            <View style={styles.analysisContainer}>
              <Text style={styles.analysisText}>{analysisResult}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, isInitializing && styles.buttonDisabled]}
            onPress={initializeSDK}
            disabled={isInitializing}
          >
            <Text style={styles.secondaryButtonText}>
              {isInitializing ? '⟳ Initializing...' : '🔄 Reinitialize'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setThoughts([])}
          >
            <Text style={styles.secondaryButtonText}>🗑 Clear Logs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Terminal At Bottom */}
      <View style={styles.terminalSection}>
        <Terminal thoughts={thoughts} title="Agent Diagnostic Logs" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ff00',
    fontFamily: 'Courier New',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'Courier New',
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  progressSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Courier New',
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#00ff00',
    paddingLeft: 10,
  },
  progressText: {
    fontSize: 10,
    color: '#999999',
    fontFamily: 'Courier New',
    textAlign: 'right',
    marginTop: 4,
  },
  actionsSection: {
    marginBottom: 20,
  },
  vibeCheckButton: {
    backgroundColor: '#00ff00',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Courier New',
  },
  logPreview: {
    fontSize: 10,
    color: '#666666',
    fontFamily: 'Courier New',
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#ffaa00',
  },
  resultSection: {
    marginBottom: 20,
  },
  analysisContainer: {
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  analysisText: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: 'Courier New',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  secondaryButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: 'Courier New',
    fontWeight: 'bold',
  },
  terminalSection: {
    margin: 20,
    marginTop: 0,
  },
});

export default App;