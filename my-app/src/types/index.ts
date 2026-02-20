// Types for RunAnywhere SDK
export interface SDKInitResult {
  success: boolean;
  error?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  url: string;
  size?: number;
  downloaded?: boolean;
}

export interface ModelDownloadProgress {
  modelId: string;
  progress: number; // 0-100
  downloadedBytes: number;
  totalBytes: number;
  status: 'downloading' | 'completed' | 'error';
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  error?: string;
  tokens?: number;
  processingTime?: number;
}

export interface AgentThought {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'processing' | 'success' | 'error' | 'warning';
}

export interface SDKStatus {
  initialized: boolean;
  modelsLoaded: string[];
  currentModel?: string;
  error?: string;
}

// DevSecOps specific types
export interface DevSecOpsEvent {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  service: string;
  event: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface SecurityAnalysis {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  description: string;
  recommendation: string;
  confidence: number;
}

// Git Repository types
export interface GitCloneProgress {
  phase: 'initializing' | 'cloning' | 'analyzing' | 'completed' | 'error';
  progress: number; // 0-100
  currentStep: string;
  totalSteps?: number;
  error?: string;
}

export interface RepositoryInfo {
  id: string;
  url: string;
  name: string;
  localPath: string;
  clonedAt: number;
  lastAnalyzed?: number;
  size?: number;
}

export interface CodeAnalysisResult {
  repositoryId: string;
  vulnerabilities: SecurityVulnerability[];
  dependencies: DependencyInfo[];
  summary: {
    totalFiles: number;
    linesOfCode: number;
    securityScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  recommendations: string[];
}

export interface SecurityVulnerability {
  id: string;
  type: 'dependency' | 'code' | 'configuration';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  file: string;
  line?: number;
  recommendation: string;
  cwe?: string; // Common Weakness Enumeration
}

export interface DependencyInfo {
  name: string;
  version: string;
  vulnerabilities: number;
  outdated: boolean;
  license?: string;
  size?: number;
}