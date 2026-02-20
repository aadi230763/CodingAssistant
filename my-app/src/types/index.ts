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