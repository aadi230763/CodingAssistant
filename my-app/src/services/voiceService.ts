/**
 * VoiceService – On-device voice command pipeline for CodeJanitor
 *
 * Pipeline: Mic → VAD → Whisper STT (whisper-tiny-en) → Command Parser → Action Router
 * TTS:      Text → Piper TTS (piper-en_US-lessac-medium) → Speaker
 *
 * Uses mock implementations compatible with Expo Go (no native modules required).
 */

import { WhisperSTT, PiperTTS, VoiceActivityDetector } from '../mocks/runanywhere-voice';
import {
  VoiceState,
  VoiceListeningState,
  TranscriptResult,
  VoiceCommand,
  TTSConfig,
  STTConfig,
  VoicePipelineStatus,
  AgentThought,
} from '../types';

// ─── Default Configs ────────────────────────────────────────────────

const DEFAULT_STT_CONFIG: STTConfig = {
  modelId: 'whisper-tiny-en',
  modelName: 'Whisper Tiny English',
  language: 'en',
  vadEnabled: true,
  vadSilenceMs: 1500,
  maxRecordingMs: 30000,
};

const DEFAULT_TTS_CONFIG: TTSConfig = {
  modelId: 'piper-en_US-lessac-medium',
  modelName: 'Piper Lessac Medium',
  voice: 'en_US-lessac-medium',
  speed: 1.0,
  pitch: 1.0,
};

// ─── Command Keywords ───────────────────────────────────────────────

const COMMAND_KEYWORDS: Record<string, VoiceCommand['intent']> = {
  audit: 'audit',
  scan: 'scan',
  vulnerabilities: 'scan',
  vulnerability: 'scan',
  explain: 'explain',
  describe: 'explain',
  report: 'report',
  summary: 'report',
  stop: 'stop',
  cancel: 'stop',
  help: 'help',
  commands: 'help',
};

// ─── VoiceService Singleton ─────────────────────────────────────────

export class VoiceService {
  private static instance: VoiceService;

  private stt: WhisperSTT;
  private tts: PiperTTS;
  private vad: VoiceActivityDetector;

  private sttConfig: STTConfig = DEFAULT_STT_CONFIG;
  private ttsConfig: TTSConfig = DEFAULT_TTS_CONFIG;

  private isInitialized = false;
  private currentState: VoiceListeningState = 'idle';
  private recordingTimeout?: ReturnType<typeof setTimeout>;

  // ── Public event callbacks ──────────────────────────────────────
  public onStateChange?: (state: VoiceState) => void;
  public onTranscript?: (result: TranscriptResult) => void;
  public onCommand?: (command: VoiceCommand) => void;
  public onThoughtAdded?: (thought: AgentThought) => void;
  public onTTSStatusChange?: (isSpeaking: boolean) => void;

  private constructor() {
    this.stt = WhisperSTT.getInstance();
    this.tts = PiperTTS.getInstance();
    this.vad = VoiceActivityDetector.getInstance();
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  // ── Initialisation ─────────────────────────────────────────────

  public async initialize(): Promise<boolean> {
    try {
      this.addThought('Initializing voice pipeline...', 'processing');

      // Initialize STT (whisper-tiny-en)
      this.addThought(`Loading STT model: ${this.sttConfig.modelName}`, 'processing');
      await this.stt.initialize({
        modelId: this.sttConfig.modelId,
        language: this.sttConfig.language,
      });
      this.addThought('✓ Whisper STT engine ready', 'success');

      // Initialize TTS (piper-en_US-lessac-medium)
      this.addThought(`Loading TTS model: ${this.ttsConfig.modelName}`, 'processing');
      await this.tts.initialize({
        modelId: this.ttsConfig.modelId,
        voice: this.ttsConfig.voice,
        speed: this.ttsConfig.speed,
        pitch: this.ttsConfig.pitch,
      });
      this.addThought('✓ Piper TTS engine ready', 'success');

      // Initialize VAD
      this.addThought('Initializing Voice Activity Detection...', 'processing');
      await this.vad.initialize({
        silenceThresholdMs: this.sttConfig.vadSilenceMs,
        speechThresholdDb: -26,
      });
      this.addThought('✓ VAD module ready', 'success');

      // Wire up STT transcript callback
      this.stt.setOnTranscript((text, confidence, isFinal) => {
        const result: TranscriptResult = {
          text,
          confidence,
          isFinal,
          timestamp: Date.now(),
          language: this.sttConfig.language,
        };

        if (this.onTranscript) this.onTranscript(result);

        if (isFinal) {
          this.addThought(`Transcript: "${text}" (confidence: ${(confidence * 100).toFixed(0)}%)`, 'info');
          this.parseAndDispatchCommand(text, confidence);
        }
      });

      // Wire up TTS status callback
      this.tts.setOnStatus((status) => {
        const isSpeaking = status === 'started';
        if (this.onTTSStatusChange) this.onTTSStatusChange(isSpeaking);
        this.updateState(isSpeaking ? 'speaking' : 'idle');
      });

      // Wire up VAD callback
      this.vad.setOnVAD((isSpeaking) => {
        if (!isSpeaking && this.currentState === 'listening') {
          // Silence detected after speech → stop listening
          this.addThought('VAD: Silence detected, processing...', 'info');
        }
      });

      this.isInitialized = true;
      this.addThought('🎤 Voice pipeline fully initialized', 'success');
      this.updateState('idle');

      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown voice init error';
      this.addThought(`Voice pipeline init failed: ${msg}`, 'error');
      this.updateState('error');
      return false;
    }
  }

  // ── Listening (STT + VAD) ─────────────────────────────────────

  public async startListening(): Promise<void> {
    if (!this.isInitialized) {
      this.addThought('Cannot listen: voice pipeline not initialized', 'error');
      return;
    }

    if (this.currentState === 'listening') {
      this.addThought('Already listening...', 'warning');
      return;
    }

    // Stop TTS if it's speaking
    if (this.tts.getIsSpeaking()) {
      await this.tts.stop();
    }

    try {
      this.updateState('listening');
      this.addThought('🎤 Listening for voice command...', 'processing');

      // Start VAD
      if (this.sttConfig.vadEnabled) {
        await this.vad.start();
      }

      // Start STT
      await this.stt.startListening();

      // Safety timeout for max recording length
      this.recordingTimeout = setTimeout(() => {
        if (this.currentState === 'listening') {
          this.addThought('Max recording duration reached', 'warning');
          this.stopListening();
        }
      }, this.sttConfig.maxRecordingMs);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.addThought(`Listening failed: ${msg}`, 'error');
      this.updateState('error');
    }
  }

  public async stopListening(): Promise<void> {
    if (this.recordingTimeout) clearTimeout(this.recordingTimeout);

    try {
      await this.stt.stopListening();
      await this.vad.stop();

      if (this.currentState === 'listening') {
        this.updateState('idle');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.addThought(`Stop listening error: ${msg}`, 'error');
    }
  }

  // ── TTS (Text-to-Speech) ──────────────────────────────────────

  public async speakAnalysis(text: string): Promise<void> {
    if (!this.isInitialized) {
      this.addThought('Cannot speak: voice pipeline not initialized', 'error');
      return;
    }

    // Stop listening before speaking
    if (this.stt.getIsListening()) {
      await this.stopListening();
    }

    try {
      this.updateState('speaking');
      this.addThought('🔊 Speaking analysis results...', 'processing');
      await this.tts.speak(text);
      this.addThought('✓ Finished speaking', 'success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown TTS error';
      this.addThought(`TTS failed: ${msg}`, 'error');
    } finally {
      if (this.currentState === 'speaking') {
        this.updateState('idle');
      }
    }
  }

  public async stopSpeaking(): Promise<void> {
    await this.tts.stop();
    if (this.currentState === 'speaking') {
      this.updateState('idle');
    }
  }

  // ── Command Parsing ───────────────────────────────────────────

  private parseAndDispatchCommand(transcript: string, confidence: number): void {
    const lower = transcript.toLowerCase().trim();
    let matchedIntent: VoiceCommand['intent'] = 'unknown';
    let matchedKeyword = '';

    for (const [keyword, intent] of Object.entries(COMMAND_KEYWORDS)) {
      if (lower.includes(keyword)) {
        matchedIntent = intent;
        matchedKeyword = keyword;
        break;
      }
    }

    const command: VoiceCommand = {
      keyword: matchedKeyword,
      intent: matchedIntent,
      rawTranscript: transcript,
      confidence,
    };

    if (matchedIntent === 'unknown') {
      this.addThought(`Unrecognized command: "${transcript}"`, 'warning');
    } else {
      this.addThought(`🗣 Command detected: [${matchedIntent.toUpperCase()}] "${transcript}"`, 'success');
    }

    // Transition to processing state while action routes
    this.updateState('processing');

    if (this.onCommand) {
      this.onCommand(command);
    }

    // Return to idle after brief delay
    setTimeout(() => {
      if (this.currentState === 'processing') {
        this.updateState('idle');
      }
    }, 500);
  }

  // ── State Management ──────────────────────────────────────────

  private updateState(state: VoiceListeningState): void {
    this.currentState = state;

    const voiceState: VoiceState = {
      isListening: state === 'listening',
      isSpeaking: state === 'speaking',
      isProcessing: state === 'processing',
      state,
      vadActive: this.vad.getIsActive(),
    };

    if (state === 'error') {
      voiceState.error = 'Voice pipeline error';
    }

    if (this.onStateChange) this.onStateChange(voiceState);
  }

  // ── Status / Getters ──────────────────────────────────────────

  public getStatus(): VoicePipelineStatus {
    return {
      sttReady: this.stt.isReady(),
      ttsReady: this.tts.isReady(),
      vadReady: this.vad.isReady(),
      sttModel: this.sttConfig.modelId,
      ttsModel: this.ttsConfig.modelId,
    };
  }

  public getState(): VoiceListeningState {
    return this.currentState;
  }

  public isVoiceReady(): boolean {
    return this.isInitialized && this.stt.isReady() && this.tts.isReady();
  }

  // ── Cleanup ───────────────────────────────────────────────────

  public async destroy(): Promise<void> {
    await this.stt.destroy();
    await this.tts.destroy();
    await this.vad.destroy();
    this.isInitialized = false;
    this.updateState('idle');
  }

  // ── Helpers ───────────────────────────────────────────────────

  private addThought(message: string, type: AgentThought['type'] = 'info'): void {
    const thought: AgentThought = {
      id: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      message,
      type,
    };
    if (this.onThoughtAdded) this.onThoughtAdded(thought);
  }
}

export default VoiceService.getInstance();
