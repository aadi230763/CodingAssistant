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
import VoiceService from './src/services/voiceService';
import StatusIndicator from './src/components/StatusIndicator';
import ProgressBar from './src/components/ProgressBar';
import Terminal from './src/components/Terminal';
import SecurityAnalysisDisplay from './src/components/SecurityAnalysisDisplay';
import MicButton from './src/components/MicButton';
import LiveTranscript from './src/components/LiveTranscript';
import {
  SDKStatus,
  ModelDownloadProgress,
  AgentThought,
  ChatMessage,
  DevSecOpsEvent,
  GitCloneProgress,
  RepositoryInfo,
  CodeAnalysisResult,
  VoiceState,
  VoiceListeningState,
  TranscriptResult,
  VoiceCommand,
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

  // Voice integration state
  const [voiceState, setVoiceState] = useState<VoiceListeningState>('idle');
  const [voiceReady, setVoiceReady] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<TranscriptResult | null>(null);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [isVoiceInitializing, setIsVoiceInitializing] = useState(false);

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

    // Set up Voice Service event handlers
    VoiceService.onStateChange = (state: VoiceState) => {
      setVoiceState(state.state);
    };
    VoiceService.onTranscript = (result: TranscriptResult) => {
      setCurrentTranscript(result);
    };
    VoiceService.onCommand = (command: VoiceCommand) => {
      setLastCommand(`[${command.intent.toUpperCase()}] ${command.rawTranscript}`);
      handleVoiceCommand(command);
    };
    VoiceService.onThoughtAdded = (thought: AgentThought) => {
      setThoughts(prevThoughts => [...prevThoughts, thought]);
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
      VoiceService.onStateChange = undefined;
      VoiceService.onTranscript = undefined;
      VoiceService.onCommand = undefined;
      VoiceService.onThoughtAdded = undefined;
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

  // ── Voice Pipeline ──────────────────────────────────────────────

  const initializeVoice = async () => {
    if (isVoiceInitializing || voiceReady) return;
    setIsVoiceInitializing(true);

    try {
      const success = await AIService.initializeVoicePipeline();
      setVoiceReady(success);
      if (!success) {
        Alert.alert('Voice Init Failed', 'Could not start the voice pipeline.');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Voice Error', msg);
    } finally {
      setIsVoiceInitializing(false);
    }
  };

  const handleMicPress = async () => {
    if (!voiceReady) {
      // First press → initialize voice pipeline
      await initializeVoice();
      return;
    }

    if (voiceState === 'listening') {
      await VoiceService.stopListening();
    } else if (voiceState === 'speaking') {
      await VoiceService.stopSpeaking();
    } else {
      setCurrentTranscript(null); // Clear previous transcript
      await VoiceService.startListening();
    }
  };

  const handleVoiceCommand = async (command: VoiceCommand) => {
    switch (command.intent) {
      case 'audit':
      case 'scan':
        handleVibeCheck();
        break;
      case 'explain':
        if (analysisResult) {
          await VoiceService.speakAnalysis(analysisResult);
        } else {
          await VoiceService.speakAnalysis('No analysis results available yet. Please run a security scan first.');
        }
        break;
      case 'report':
        if (securityAnalysis) {
          const summary = `Security report: Found ${securityAnalysis.vulnerabilities.length} vulnerabilities. Risk level is ${securityAnalysis.summary.riskLevel}. Security score is ${securityAnalysis.summary.securityScore} out of 100.`;
          await VoiceService.speakAnalysis(summary);
        } else {
          await VoiceService.speakAnalysis('No security report available. Clone a repository and run analysis first.');
        }
        break;
      case 'stop':
        await VoiceService.stopListening();
        await VoiceService.stopSpeaking();
        break;
      case 'help':
        await VoiceService.speakAnalysis(
          'Available commands: say audit or scan to analyze security. Say explain to hear recent results. Say report for repository summary. Say stop to cancel.'
        );
        break;
      default:
        await VoiceService.speakAnalysis('Sorry, I did not understand that command. Say help for available commands.');
        break;
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

        {/* ── Voice Command Section ──────────────────────────── */}
        <View style={styles.voiceSection}>
          <Text style={styles.sectionTitle}>🎤 Voice Commands</Text>

          <View style={styles.voiceStatusRow}>
            <View style={[styles.voiceBadge, { backgroundColor: voiceReady ? '#003300' : '#1a1a1a' }]}>
              <Text style={[styles.voiceBadgeText, { color: voiceReady ? '#00ff00' : '#666' }]}>
                STT: {voiceReady ? 'whisper-tiny-en ✓' : 'not loaded'}
              </Text>
            </View>
            <View style={[styles.voiceBadge, { backgroundColor: voiceReady ? '#002233' : '#1a1a1a' }]}>
              <Text style={[styles.voiceBadgeText, { color: voiceReady ? '#00ccff' : '#666' }]}>
                TTS: {voiceReady ? 'piper-lessac ✓' : 'not loaded'}
              </Text>
            </View>
          </View>

          <MicButton
            state={voiceReady ? voiceState : 'idle'}
            onPress={handleMicPress}
            disabled={isVoiceInitializing}
            size={72}
          />

          {isVoiceInitializing && (
            <Text style={styles.voiceInitText}>Initializing voice pipeline...</Text>
          )}
          {!voiceReady && !isVoiceInitializing && (
            <Text style={styles.voiceInitText}>Tap the mic to initialize voice commands</Text>
          )}

          <LiveTranscript
            transcript={currentTranscript}
            voiceState={voiceReady ? voiceState : 'idle'}
            lastCommand={lastCommand}
          />

          {voiceReady && (
            <View style={styles.voiceHints}>
              <Text style={styles.voiceHintTitle}>Voice Commands:</Text>
              <Text style={styles.voiceHintItem}>• "audit" / "scan" → Run security analysis</Text>
              <Text style={styles.voiceHintItem}>• "explain" → Hear analysis results</Text>
              <Text style={styles.voiceHintItem}>• "report" → Hear repo summary</Text>
              <Text style={styles.voiceHintItem}>• "help" → List commands</Text>
            </View>
          )}
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
  // Voice Command Styles
  voiceSection: {
    marginBottom: 20,
    backgroundColor: '#0a0a0a',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a3a1a',
  },
  voiceStatusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  voiceBadge: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  voiceBadgeText: {
    fontSize: 9,
    fontFamily: 'Courier New',
    fontWeight: '700',
  },
  voiceInitText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 10,
    fontFamily: 'Courier New',
    marginBottom: 8,
  },
  voiceHints: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  voiceHintTitle: {
    fontSize: 10,
    fontFamily: 'Courier New',
    fontWeight: '700',
    color: '#888',
    marginBottom: 4,
  },
  voiceHintItem: {
    fontSize: 10,
    fontFamily: 'Courier New',
    color: '#555',
    lineHeight: 16,
  },
});

export default App;