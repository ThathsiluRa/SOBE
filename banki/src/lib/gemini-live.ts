/**
 * Gemini Multimodal Live API client
 * Uses WebSocket bidirectional streaming for real-time voice conversation.
 * Audio output is PCM16 at 24kHz played via Web Audio API (actual Gemini voice).
 */

export type GeminiVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';

export interface GeminiLiveConfig {
  apiKey: string;
  systemPrompt: string;
  voiceName?: GeminiVoiceName;
  onText?: (text: string, isFinal: boolean) => void;
  onAudioStart?: () => void;
  onAudioDone?: () => void;
  onTurnComplete?: () => void;
  onConnected?: () => void;
  onError?: (error: string) => void;
  onDisconnected?: () => void;
}

const GEMINI_LIVE_MODEL = 'models/gemini-2.0-flash-exp';
const SAMPLE_RATE = 24000;

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private config: GeminiLiveConfig;
  private audioCtx: AudioContext | null = null;
  private nextAudioAt = 0;
  private activeNodes: AudioBufferSourceNode[] = [];
  private pendingText = '';
  private _connected = false;

  constructor(config: GeminiLiveConfig) {
    this.config = config;
  }

  get isConnected() {
    return this._connected && this.ws?.readyState === WebSocket.OPEN;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url =
        `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta` +
        `.GenerativeService.BidiGenerateContent?key=${this.config.apiKey}`;

      try {
        this.ws = new WebSocket(url);
      } catch {
        reject(new Error('WebSocket creation failed'));
        return;
      }

      const timeout = setTimeout(() => {
        this.ws?.close();
        reject(new Error('Connection timed out after 10s'));
      }, 10000);

      this.ws.onopen = () => {
        // Send setup — voice + text modalities, system prompt
        this.ws!.send(
          JSON.stringify({
            setup: {
              model: GEMINI_LIVE_MODEL,
              generationConfig: {
                responseModalities: ['AUDIO', 'TEXT'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: this.config.voiceName ?? 'Aoede',
                    },
                  },
                },
              },
              systemInstruction: {
                parts: [
                  {
                    text:
                      this.config.systemPrompt +
                      '\n\n## CONTEXT MESSAGES\nYou may receive messages ' +
                      'prefixed with [Context: {...}]. Use this JSON to ' +
                      'understand the current application state. Never ' +
                      'mention the context prefix — respond naturally.',
                  },
                ],
              },
            },
          })
        );
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);

          if (data.setupComplete) {
            clearTimeout(timeout);
            this._connected = true;
            this.config.onConnected?.();
            resolve();
            return;
          }

          if (data.serverContent) {
            this.handleContent(data.serverContent);
          }
        } catch (err) {
          console.error('[GeminiLive] parse error', err);
        }
      };

      this.ws.onerror = () => {
        clearTimeout(timeout);
        const msg = 'Could not connect to Gemini Live API. Check your API key.';
        this.config.onError?.(msg);
        reject(new Error(msg));
      };

      this.ws.onclose = (e) => {
        clearTimeout(timeout);
        this._connected = false;
        this.config.onDisconnected?.();
        if (!e.wasClean) {
          this.config.onError?.(`Connection dropped (code ${e.code})`);
        }
      };
    });
  }

  sendText(userMessage: string, context?: Record<string, unknown>): void {
    if (!this.isConnected) {
      this.config.onError?.('Not connected — please wait or reload.');
      return;
    }

    // Inject context as a hidden prefix so Banki stays in the right step
    const text = context
      ? `[Context: ${JSON.stringify(context)}]\nCustomer says: ${userMessage}`
      : userMessage;

    this.ws!.send(
      JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text }] }],
          turnComplete: true,
        },
      })
    );
  }

  stopAudio(): void {
    this.activeNodes.forEach((n) => {
      try {
        n.stop();
      } catch {
        // already stopped
      }
    });
    this.activeNodes = [];
    this.nextAudioAt = 0;
  }

  disconnect(): void {
    this.stopAudio();
    this.ws?.close();
    this.ws = null;
    this.audioCtx?.close().catch(() => {});
    this.audioCtx = null;
    this._connected = false;
  }

  // ── Private ────────────────────────────────────────────────────────────

  private handleContent(content: {
    modelTurn?: {
      parts?: Array<{
        text?: string;
        inlineData?: { mimeType: string; data: string };
      }>;
    };
    turnComplete?: boolean;
  }) {
    for (const part of content.modelTurn?.parts ?? []) {
      if (part.inlineData?.data) {
        this.config.onAudioStart?.();
        this.scheduleAudio(part.inlineData.data);
      }
      if (part.text) {
        this.pendingText += part.text;
        this.config.onText?.(this.pendingText, false);
      }
    }

    if (content.turnComplete) {
      if (this.pendingText) {
        this.config.onText?.(this.pendingText, true);
        this.pendingText = '';
      }
      this.config.onTurnComplete?.();
    }
  }

  /**
   * Decode a base64 PCM16-LE chunk and schedule it for gapless playback.
   */
  private scheduleAudio(base64: string): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
        this.nextAudioAt = 0;
      }

      // base64 → Uint8Array
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      // PCM16-LE → Float32
      const samples = bytes.length / 2;
      const float32 = new Float32Array(samples);
      const view = new DataView(bytes.buffer);
      for (let i = 0; i < samples; i++) {
        float32[i] = view.getInt16(i * 2, true) / 32768;
      }

      const buffer = this.audioCtx.createBuffer(1, samples, SAMPLE_RATE);
      buffer.copyToChannel(float32, 0);

      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioCtx.destination);

      // Gapless scheduling: each chunk starts exactly when the previous ends
      const startAt = Math.max(this.audioCtx.currentTime + 0.05, this.nextAudioAt);
      source.start(startAt);
      this.nextAudioAt = startAt + buffer.duration;

      this.activeNodes.push(source);
      source.onended = () => {
        this.activeNodes = this.activeNodes.filter((n) => n !== source);
        if (this.activeNodes.length === 0) {
          this.config.onAudioDone?.();
        }
      };
    } catch (err) {
      console.error('[GeminiLive] audio error', err);
    }
  }
}
