import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject, Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface MessageChunk {
    type: 'text' | 'image_prompt' | 'video_url' | 'error' | 'user_question' | 'tutor_answer';
    content: string;
    caption?: string; // For video captions
    image_url?: string; // For image URLs
}

export interface WebSocketMessage {
    emotion?: {
        emotion: string;
        confidence: number;
        action: string;
    };
    content?: MessageChunk[];
    learning_path?: any;
    error?: string;
    type?: string; // Add type for lesson_summary check
}

@Injectable({
    providedIn: 'root'
})
export class RealTimeService {
    // ... existing props ...
    private socket$: WebSocketSubject<WebSocketMessage> | null = null;

    // Subjects for different data streams
    private lessonContentSubject = new Subject<MessageChunk[]>();
    private emotionEventSubject = new Subject<any>();
    private emotionResultSubject = new Subject<any>(); // For emotion_result messages
    private emotionDetectedSubject = new Subject<any>(); // For emotion_detected messages from demo
    private connectionStatusSubject = new Subject<boolean>();
    private errorSubject = new Subject<{ type: string, message: string }>();

    public lessonStream$ = this.lessonContentSubject.asObservable();
    public emotionEvents$ = this.emotionEventSubject.asObservable();
    public emotionResults$ = this.emotionResultSubject.asObservable(); // Expose emotion results
    public emotionDetected$ = this.emotionDetectedSubject.asObservable(); // NEW: For demo emotions
    public isConnected$ = this.connectionStatusSubject.asObservable();
    public errors$ = this.errorSubject.asObservable();

    private router = inject(Router);

    constructor() { }

    public connect(url: string = environment.wsUrl || 'ws://localhost:8000/ws/session/'): void {
        if (this.socket$ && !this.socket$.closed) {
            return;
        }

        this.socket$ = webSocket({
            url: url,
            openObserver: {
                next: () => {
                    console.log('[RealTimeService] Connection established');
                    this.connectionStatusSubject.next(true);
                }
            },
            closeObserver: {
                next: () => {
                    console.log('[RealTimeService] Connection closed');
                    this.connectionStatusSubject.next(false);
                    this.socket$ = null;
                }
            }
        });

        this.socket$.pipe(
            retry({ count: 5, delay: 2000 }), // Retry connection logic
            catchError(error => {
                console.error('[RealTimeService] WebSocket error:', error);
                return throwError(() => new Error(error));
            })
        ).subscribe({
            next: (message: WebSocketMessage) => this.handleMessage(message),
            error: (err) => console.error('[RealTimeService] Subscription error:', err)
        });
    }

    public sendMessage(msg: any): void {
        if (this.socket$) {
            this.socket$.next(msg);
        } else {
            console.warn('[RealTimeService] Cannot send message, socket not connected.');
        }
    }

    public startSession(formData: any): void {
        const payload = {
            start_lesson: true,
            topic: formData.topic,
            user_alias: formData.alias || 'User',
            difficulty: formData.difficulty || 'intermediate',
            style: formData.style || 'mixed',
            age: formData.age || null,
            language: formData.language || 'es'
        };
        console.log('[RealTimeService] Starting session with payload:', payload);
        this.sendMessage(payload);
    }

    public disconnect(): void {
        if (this.socket$) {
            this.socket$.complete();
            this.socket$ = null;
        }
    }

    private handleMessage(message: WebSocketMessage): void {
        console.log('[RealTimeService] Received:', message);

        // Get message type
        const messageType = (message as any).type;

        // 1. Handle Emotion Events / Interruption
        if (message.emotion) {
            // If emotion indicates confusion, emit event
            if (message.emotion.action === 'interrupt' || message.emotion.emotion === 'confusion') {
                this.emotionEventSubject.next(message.emotion);
            }
        }

        // 2. Handle Emotion Detection Results (from demo or real detection)
        if (messageType === 'emotion_result') {
            console.log('🧠 [RealTimeService] Emotion result received:', message);
            this.emotionResultSubject.next(message);
        }

        // 🎬 NEW: Handle emotion_detected messages from demo script
        if (messageType === 'emotion_detected') {
            console.log('🎭 [RealTimeService] Emotion detected:', (message as any).emotion);
            const emotionData = message as any;

            // Emit emotion_detected event for EmotionDetectionService to subscribe
            this.emotionDetectedSubject.next({
                emotion: emotionData.emotion,
                confidence: emotionData.confidence || 0.5,
                message: emotionData.message
            });

            console.log(`✅ [RealTimeService] Emotion event emitted: ${emotionData.emotion} (${((emotionData.confidence || 0.5) * 100).toFixed(0)}%)`);
        }

        // 3. Handle Lesson Content
        if (messageType === 'lesson_content' && message.content && Array.isArray(message.content)) {
            console.log('✅ [RealTimeService] Lesson content received:', message.content.length, 'chunks');
            this.lessonContentSubject.next(message.content);
        }

        // 4. Handle Learning Path (log only, no action)
        if (messageType === 'learning_path') {
            console.log('📍 [RealTimeService] Learning Path received:', (message as any).data);
        }

        // 5. Handle Lesson Summary (Completion)
        if (messageType === 'lesson_summary') {
            console.log('🏁 [RealTimeService] Lesson summary received');
            localStorage.setItem('kairos_history', JSON.stringify(message));
            this.router.navigate(['/dashboard']);
        }

        // 6. Handle Errors
        if (message.error || messageType === 'error') {
            const errorMsg = message.error || (message as any).message || 'Unknown error';
            console.error('❌ [RealTimeService] Server error:', errorMsg);
            this.errorSubject.next({
                type: 'backend_error',
                message: errorMsg
            });
        }
    }
}
