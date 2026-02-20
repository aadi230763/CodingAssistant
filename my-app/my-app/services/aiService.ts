import { RunAnywhere, SDKEnvironment } from '../mocks/runanywhere-core';
import { LlamaCPP } from '../mocks/runanywhere-llamacpp';
import {
  SDKInitResult,
  ModelInfo,
  ModelDownloadProgress,
  ChatMessage,
  ChatResponse,
  SDKStatus,
  AgentThought,
} from '../types';

export class AIService {
  private static instance: AIService;
  private isInitialized = false;
  private downloadProgress = new Map<string, ModelDownloadProgress>();
  private modelInfo: ModelInfo = {
    id: 'smollm2-360m',
    name: 'SmolLM2',
    url: 'https://huggingface.co/prithivMLmods/SmolLM2-360M-GGUF/resolve/main/SmolLM2-360M.Q8_0.gguf',
  };

  // Event handlers for UI updates
  public onStatusChange?: (status: SDKStatus) => void;
  public onProgressUpdate?: (progress: ModelDownloadProgress) => void;
  public onThoughtAdded?: (thought: AgentThought) => void;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private addThought(message: string, type: AgentThought['type'] = 'info') {
    const thought: AgentThought = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      message,
      type,
    };

    if (this.onThoughtAdded) {
      this.onThoughtAdded(thought);
    }
  }

  public async initialize(): Promise<SDKInitResult> {
    try {
      this.addThought('Initializing CodeJanitor SDK...', 'processing');

      // Initialize RunAnywhere SDK
      await RunAnywhere.initialize({ 
        environment: SDKEnvironment.Development 
      });

      this.addThought('SDK initialized successfully', 'success');

      // Register LlamaCPP backend
      LlamaCPP.register();
      this.addThought('LlamaCPP backend registered', 'info');

      this.isInitialized = true;

      // Notify status change
      if (this.onStatusChange) {
        this.onStatusChange({
          initialized: true,
          modelsLoaded: [],
          currentModel: undefined,
        });
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during initialization';
      this.addThought(`Initialization failed: ${errorMessage}`, 'error');

      if (this.onStatusChange) {
        this.onStatusChange({
          initialized: false,
          modelsLoaded: [],
          error: errorMessage,
        });
      }

      return { success: false, error: errorMessage };
    }
  }

  public async downloadModel(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    try {
      this.addThought(`Starting download of ${this.modelInfo.name}...`, 'processing');

      // Initialize progress tracking
      const initialProgress: ModelDownloadProgress = {
        modelId: this.modelInfo.id,
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 1,
        status: 'downloading',
      };

      this.downloadProgress.set(this.modelInfo.id, initialProgress);
      
      if (this.onProgressUpdate) {
        this.onProgressUpdate(initialProgress);
      }

      // Simulate progress updates (in real implementation, this would come from SDK callbacks)
      const progressInterval = setInterval(() => {
        const current = this.downloadProgress.get(this.modelInfo.id);
        if (current && current.status === 'downloading') {
          const newProgress = Math.min(current.progress + 5, 100);
          const updatedProgress: ModelDownloadProgress = {
            ...current,
            progress: newProgress,
            downloadedBytes: (newProgress / 100) * 50_000_000, // ~50MB model
            totalBytes: 50_000_000,
          };

          this.downloadProgress.set(this.modelInfo.id, updatedProgress);
          
          if (this.onProgressUpdate) {
            this.onProgressUpdate(updatedProgress);
          }

          if (newProgress >= 100) {
            clearInterval(progressInterval);
            updatedProgress.status = 'completed';
            this.downloadProgress.set(this.modelInfo.id, updatedProgress);
            
            if (this.onProgressUpdate) {
              this.onProgressUpdate(updatedProgress);
            }

            this.addThought(`${this.modelInfo.name} downloaded successfully`, 'success');
          }
        }
      }, 200);

      // Add the model to LlamaCPP
      await LlamaCPP.addModel({
        id: this.modelInfo.id,
        name: this.modelInfo.name,
        url: this.modelInfo.url,
      });

      this.addThought('Model loaded and ready for inference', 'success');

      // Update status
      if (this.onStatusChange) {
        this.onStatusChange({
          initialized: true,
          modelsLoaded: [this.modelInfo.id],
          currentModel: this.modelInfo.id,
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during model download';
      
      const errorProgress: ModelDownloadProgress = {
        modelId: this.modelInfo.id,
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 1,
        status: 'error',
        error: errorMessage,
      };

      this.downloadProgress.set(this.modelInfo.id, errorProgress);
      
      if (this.onProgressUpdate) {
        this.onProgressUpdate(errorProgress);
      }

      this.addThought(`Model download failed: ${errorMessage}`, 'error');
      throw error;
    }
  }

  public async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    const currentProgress = this.downloadProgress.get(this.modelInfo.id);
    if (!currentProgress || currentProgress.status !== 'completed') {
      throw new Error('Model not ready. Please wait for download to complete.');
    }

    try {
      this.addThought('Processing chat request...', 'processing');

      const startTime = Date.now();

      // Format messages for the LLM
      const prompt = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n') + '\nassistant:';

      // Simulate LLM response (in real implementation, this would call LlamaCPP)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      const processingTime = Date.now() - startTime;
      
      // Mock response generation based on message content
      let response = '';
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage.content.includes('DevSecOps') || lastMessage.content.includes('security')) {
        response = this.generateSecurityAnalysis(lastMessage.content);
      } else {
        response = 'I\'m CodeJanitor, your AI-powered DevSecOps assistant. I can help analyze security logs, audit CI/CD pipelines, and identify potential vulnerabilities. How can I assist you today?';
      }

      this.addThought(`Generated response (${response.length} chars)`, 'success');

      return {
        success: true,
        response,
        tokens: Math.floor(response.length / 4), // Rough token estimate
        processingTime,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during chat';
      this.addThought(`Chat failed: ${errorMessage}`, 'error');

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private generateSecurityAnalysis(logContent: string): string {
    // Simple analysis based on log patterns
    let analysis = '';
    
    if (logContent.includes('failed') || logContent.includes('error')) {
      analysis += '🔍 **Security Analysis**: Detected failure events in logs.\n\n';
      analysis += '**Findings**:\n';
      analysis += '• Authentication/authorization failures detected\n';
      analysis += '• Potential security incident requiring investigation\n';
      analysis += '• Recommend immediate review of access patterns\n\n';
      analysis += '**Recommendations**:\n';
      analysis += '• Enable enhanced monitoring for suspicious activities\n';
      analysis += '• Review access logs for anomalous patterns\n';
      analysis += '• Consider implementing rate limiting\n';
    } else if (logContent.includes('unauthorized') || logContent.includes('403')) {
      analysis += '🚨 **Access Control Alert**: Unauthorized access attempts detected.\n\n';
      analysis += '**Severity**: HIGH\n';
      analysis += '**Action Required**: Immediate investigation of access patterns\n';
    } else {
      analysis += '✅ **Log Analysis Complete**: No immediate security concerns detected.\n\n';
      analysis += 'Continue monitoring for anomalous patterns.';
    }

    return analysis;
  }

  public getModelDownloadProgress(modelId: string): ModelDownloadProgress | undefined {
    return this.downloadProgress.get(modelId);
  }

  public isModelReady(): boolean {
    const progress = this.downloadProgress.get(this.modelInfo.id);
    return progress?.status === 'completed';
  }

  public getStatus(): SDKStatus {
    const modelsLoaded = Array.from(this.downloadProgress.keys())
      .filter(id => this.downloadProgress.get(id)?.status === 'completed');

    return {
      initialized: this.isInitialized,
      modelsLoaded,
      currentModel: modelsLoaded.length > 0 ? this.modelInfo.id : undefined,
    };
  }
}

export default AIService.getInstance();