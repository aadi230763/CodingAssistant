/**
 * Mock RunAnywhere Voice SDK
 * Simulates whisper-tiny-en (STT), piper-en_US-lessac-medium (TTS), and VAD
 * Works in Expo Go without native modules
 */

export interface WhisperConfig {
  modelId: string;
  language: string;
}

export interface PiperConfig {
  modelId: string;
  voice: string;
  speed: number;
  pitch: number;
}

export interface VADConfig {
  silenceThresholdMs: number;
  speechThresholdDb: number;
}

type TranscriptCallback = (text: string, confidence: number, isFinal: boolean) => void;
type VADCallback = (isSpeaking: boolean) => void;
type TTSCallback = (status: 'started' | 'finished' | 'error', error?: string) => void;

// Simulated voice commands that the mock STT will "hear"
const MOCK_TRANSCRIPTS = [
  { text: 'audit the repository', intent: 'audit', delay: 2000 },
  { text: 'scan for vulnerabilities', intent: 'scan', delay: 2500 },
  { text: 'explain the security findings', intent: 'explain', delay: 3000 },
  { text: 'generate security report', intent: 'report', delay: 2200 },
  { text: 'help me with commands', intent: 'help', delay: 1800 },
  { text: 'stop listening', intent: 'stop', delay: 1500 },
];

/**
 * Mock Whisper STT Engine (whisper-tiny-en)
 */
export class WhisperSTT {
  private static _instance: WhisperSTT;
  private initialized = false;
  private isListening = false;
  private onTranscript?: TranscriptCallback;
  private currentTimeout?: ReturnType<typeof setTimeout>;
  private interimTimeout?: ReturnType<typeof setTimeout>;

  static getInstance(): WhisperSTT {
    if (!WhisperSTT._instance) {
      WhisperSTT._instance = new WhisperSTT();
    }
    return WhisperSTT._instance;
  }

  async initialize(config: WhisperConfig): Promise<boolean> {
    // Simulate model loading delay
    await new Promise(resolve => setTimeout(resolve, 800));
    this.initialized = true;
    console.log(`[WhisperSTT] Initialized with model: ${config.modelId}`);
    return true;
  }

  isReady(): boolean {
    return this.initialized;
  }

  setOnTranscript(callback: TranscriptCallback): void {
    this.onTranscript = callback;
  }

  async startListening(): Promise<void> {
    if (!this.initialized) throw new Error('WhisperSTT not initialized');
    if (this.isListening) return;

    this.isListening = true;
    console.log('[WhisperSTT] Listening started...');

    // Pick a random mock transcript
    const mock = MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)];

    // Simulate interim results (partial recognition)
    const words = mock.text.split(' ');
    let partialText = '';

    for (let i = 0; i < words.length; i++) {
      const wordIndex = i;
      this.interimTimeout = setTimeout(() => {
        if (!this.isListening) return;
        partialText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
        if (this.onTranscript) {
          this.onTranscript(partialText, 0.5 + (wordIndex / words.length) * 0.3, false);
        }
      }, 400 + (i * 350));
    }

    // Send final result after full "recognition"
    this.currentTimeout = setTimeout(() => {
      if (!this.isListening) return;
      if (this.onTranscript) {
        this.onTranscript(mock.text, 0.92 + Math.random() * 0.07, true);
      }
      this.isListening = false;
    }, mock.delay);
  }

  async stopListening(): Promise<void> {
    this.isListening = false;
    if (this.currentTimeout) clearTimeout(this.currentTimeout);
    if (this.interimTimeout) clearTimeout(this.interimTimeout);
    console.log('[WhisperSTT] Listening stopped');
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  async destroy(): Promise<void> {
    await this.stopListening();
    this.initialized = false;
  }
}

/**
 * Mock Piper TTS Engine (piper-en_US-lessac-medium)
 */
export class PiperTTS {
  private static _instance: PiperTTS;
  private initialized = false;
  private isSpeaking = false;
  private onStatus?: TTSCallback;
  private currentTimeout?: ReturnType<typeof setTimeout>;

  static getInstance(): PiperTTS {
    if (!PiperTTS._instance) {
      PiperTTS._instance = new PiperTTS();
    }
    return PiperTTS._instance;
  }

  async initialize(config: PiperConfig): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 600));
    this.initialized = true;
    console.log(`[PiperTTS] Initialized with model: ${config.modelId}, voice: ${config.voice}`);
    return true;
  }

  isReady(): boolean {
    return this.initialized;
  }

  setOnStatus(callback: TTSCallback): void {
    this.onStatus = callback;
  }

  async speak(text: string): Promise<void> {
    if (!this.initialized) throw new Error('PiperTTS not initialized');
    if (this.isSpeaking) {
      await this.stop();
    }

    this.isSpeaking = true;
    if (this.onStatus) this.onStatus('started');
    console.log(`[PiperTTS] Speaking: "${text.substring(0, 50)}..."`);

    // Simulate speaking duration based on text length (~150 words per minute)
    const wordCount = text.split(' ').length;
    const durationMs = Math.max(1000, (wordCount / 150) * 60 * 1000);
    // Cap at 5 seconds for mock
    const cappedDuration = Math.min(durationMs, 5000);

    return new Promise((resolve) => {
      this.currentTimeout = setTimeout(() => {
        this.isSpeaking = false;
        if (this.onStatus) this.onStatus('finished');
        console.log('[PiperTTS] Finished speaking');
        resolve();
      }, cappedDuration);
    });
  }

  async stop(): Promise<void> {
    if (this.currentTimeout) clearTimeout(this.currentTimeout);
    this.isSpeaking = false;
    if (this.onStatus) this.onStatus('finished');
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  async destroy(): Promise<void> {
    await this.stop();
    this.initialized = false;
  }
}

/**
 * Mock Voice Activity Detection (VAD)
 */
export class VoiceActivityDetector {
  private static _instance: VoiceActivityDetector;
  private initialized = false;
  private isActive = false;
  private onVAD?: VADCallback;
  private simulationInterval?: ReturnType<typeof setInterval>;

  static getInstance(): VoiceActivityDetector {
    if (!VoiceActivityDetector._instance) {
      VoiceActivityDetector._instance = new VoiceActivityDetector();
    }
    return VoiceActivityDetector._instance;
  }

  async initialize(config: VADConfig): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    this.initialized = true;
    console.log(`[VAD] Initialized with silence threshold: ${config.silenceThresholdMs}ms`);
    return true;
  }

  isReady(): boolean {
    return this.initialized;
  }

  setOnVAD(callback: VADCallback): void {
    this.onVAD = callback;
  }

  async start(): Promise<void> {
    if (!this.initialized) throw new Error('VAD not initialized');
    this.isActive = true;

    // Simulate VAD detecting speech → silence pattern
    let speechDetected = false;
    this.simulationInterval = setInterval(() => {
      if (!this.isActive) return;

      if (!speechDetected) {
        // Simulate detecting speech after a brief delay
        speechDetected = true;
        if (this.onVAD) this.onVAD(true);
      }
    }, 500);
  }

  triggerSilence(): void {
    if (this.onVAD) this.onVAD(false);
  }

  async stop(): Promise<void> {
    this.isActive = false;
    if (this.simulationInterval) clearInterval(this.simulationInterval);
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  async destroy(): Promise<void> {
    await this.stop();
    this.initialized = false;
  }
}
