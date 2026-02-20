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
  TextInput,
} from 'react-native';

import AIService from './src/services/aiService';
import GitService from './src/services/gitService';
import StatusIndicator from './src/components/StatusIndicator';
import ProgressBar from './src/components/ProgressBar';
import Terminal from './src/components/Terminal';
import SecurityAnalysisDisplay from './src/components/SecurityAnalysisDisplay';
import {
  SDKStatus,
  ModelDownloadProgress,
  AgentThought,
  ChatMessage,
  DevSecOpsEvent,
  GitCloneProgress,
  RepositoryInfo,
  CodeAnalysisResult,
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
  const [gitCloneProgress, setGitCloneProgress] = useState<GitCloneProgress | null>(null);
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Git integration state
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [isCloning, setIsCloning] = useState(false);
  const [currentRepository, setCurrentRepository] = useState<RepositoryInfo | null>(null);
  const [securityAnalysis, setSecurityAnalysis] = useState<CodeAnalysisResult | null>(null);

  useEffect(() => {
    // Set up AI Service event handlers
    AIService.onStatusChange = setSdkStatus;
    AIService.onProgressUpdate = setDownloadProgress;
    AIService.onThoughtAdded = (thought: AgentThought) => {
      setThoughts(prevThoughts => [...prevThoughts, thought]);
    };

    // Set up Git Service event handlers
    GitService.onCloneProgress = setGitCloneProgress;
    GitService.onThoughtAdded = (thought: AgentThought) => {
      setThoughts(prevThoughts => [...prevThoughts, thought]);
    };
    GitService.onAnalysisComplete = (result: CodeAnalysisResult) => {
      setSecurityAnalysis(result);
      setThoughts(prevThoughts => [...prevThoughts, {
        id: Date.now().toString(),
        timestamp: Date.now(),
        message: `Security analysis completed for repository: ${result.vulnerabilities.length} vulnerabilities found`,
        type: 'success',
      }]);
    };

    // Auto-initialize on app start
    initializeSDK();

    return () => {
      // Cleanup event handlers
      AIService.onStatusChange = undefined;
      AIService.onProgressUpdate = undefined;
      AIService.onThoughtAdded = undefined;
      GitService.onCloneProgress = undefined;
      GitService.onThoughtAdded = undefined;
      GitService.onAnalysisComplete = undefined;
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

  const handleCloneRepository = async () => {
    if (!githubUrl.trim()) {
      Alert.alert('Missing URL', 'Please enter a GitHub repository URL');
      return;
    }

    if (GitService.isCloneInProgress()) {
      Alert.alert('Clone in Progress', 'Another repository is currently being cloned. Please wait.');
      return;
    }

    setIsCloning(true);
    setSecurityAnalysis(null); // Clear previous analysis

    try {
      const repository = await GitService.cloneUserRepo(githubUrl.trim());
      setCurrentRepository(repository);
      setGithubUrl(''); // Clear input after successful clone
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Clone Failed', errorMessage);
    } finally {
      setIsCloning(false);
    }
  };

  const isValidGitHubUrl = (url: string): boolean => {
    const githubPattern = /^https:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+(?:\.git)?(?:\/)?$/;
    return githubPattern.test(url);
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

        {/* Git Clone Progress Section */}
        {gitCloneProgress && gitCloneProgress.phase !== 'completed' && (
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>📁 Repository Clone</Text>
            <ProgressBar 
              progress={gitCloneProgress.progress}
              showPercentage={true}
              color={gitCloneProgress.phase === 'error' ? '#ff0040' : '#00aaff'}
            />
            <Text style={styles.progressText}>
              {gitCloneProgress.currentStep}
            </Text>
            {gitCloneProgress.error && (
              <Text style={[styles.progressText, { color: '#ff0040' }]}>
                Error: {gitCloneProgress.error}
              </Text>
            )}
          </View>
        )}

        {/* Repository Analysis Section */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>🔗 Repository Analysis</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.urlInput}
              value={githubUrl}
              onChangeText={setGithubUrl}
              placeholder="Enter GitHub repository URL..."
              placeholderTextColor="#666666"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleCloneRepository}
            />
            <TouchableOpacity
              style={[
                styles.cloneButton,
                (!githubUrl.trim() || isCloning || !isValidGitHubUrl(githubUrl.trim())) && styles.buttonDisabled,
              ]}
              onPress={handleCloneRepository}
              disabled={!githubUrl.trim() || isCloning || !isValidGitHubUrl(githubUrl.trim())}
            >
              <Text style={styles.buttonText}>
                {isCloning ? '⟳ Cloning...' : '📁 Clone & Analyze'}
              </Text>
            </TouchableOpacity>
          </View>

          {githubUrl.trim() && !isValidGitHubUrl(githubUrl.trim()) && (
            <Text style={styles.validationError}>
              Please enter a valid GitHub repository URL (e.g., https://github.com/user/repo)
            </Text>
          )}

          {currentRepository && (
            <Text style={styles.currentRepoText}>
              📊 Current: {currentRepository.name} ({new Date(currentRepository.clonedAt).toLocaleTimeString()})
            </Text>
          )}
        </View>

        {/* Security Analysis Results */}
        {securityAnalysis && (
          <SecurityAnalysisDisplay
            analysis={securityAnalysis}
            onClose={() => setSecurityAnalysis(null)}
          />
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
  // Git Repository Styles
  inputContainer: {
    marginBottom: 16,
  },
  urlInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    padding: 12,
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Courier New',
    marginBottom: 12,
    minHeight: 40,
  },
  cloneButton: {
    backgroundColor: '#00aaff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#00aaff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  validationError: {
    color: '#ff0040',
    fontSize: 10,
    fontFamily: 'Courier New',
    marginTop: 4,
    paddingLeft: 4,
  },
  currentRepoText: {
    color: '#00ff00',
    fontSize: 11,
    fontFamily: 'Courier New',
    marginTop: 8,
    paddingHorizontal: 4,
  },
});

export default App;