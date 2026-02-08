import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject, Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface MessageChunk {
    type: 'text' | 'image_prompt' | 'error' | 'user_question' | 'tutor_answer';
    content: string;
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
    private connectionStatusSubject = new Subject<boolean>();
    private errorSubject = new Subject<{type: string, message: string}>();

    public lessonStream$ = this.lessonContentSubject.asObservable();
    public emotionEvents$ = this.emotionEventSubject.asObservable();
    public emotionResults$ = this.emotionResultSubject.asObservable(); // Expose emotion results
    public isConnected$ = this.connectionStatusSubject.asObservable();
    public errors$ = this.errorSubject.asObservable();

    constructor(private router: Router) { }

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
        console.log('[RealTimeService] Recibido:', message);

        // Get message type
        const messageType = (message as any).type;

        // 1. Manejar Eventos de Emoción / Interrupción
        if (message.emotion) {
            // Si la emoción indica confusión, emitir evento
            if (message.emotion.action === 'interrupt' || message.emotion.emotion === 'confusion') {
                this.emotionEventSubject.next(message.emotion);
            }
        }

        // 2. Manejar Respuestas de Detección Emocional
        if (messageType === 'emotion_result') {
            console.log('🧠 [RealTimeService] Emotion result received:', message);
            this.emotionResultSubject.next(message);
        }

        // 3. Manejar Contenido de Lección
        if (messageType === 'lesson_content' && message.content && Array.isArray(message.content)) {
            console.log('✅ [RealTimeService] Contenido de lección recibido:', message.content.length, 'chunks');
            this.lessonContentSubject.next(message.content);
        }

        // 4. Manejar Learning Path (solo log, no acción)
        if (messageType === 'learning_path') {
            console.log('📍 [RealTimeService] Learning Path recibido:', (message as any).data);
        }

        // 5. Manejar Resumen de Lección (Finalización)
        if (messageType === 'lesson_summary') {
            console.log('🏁 [RealTimeService] Resumen de lección recibido');
            localStorage.setItem('kairos_history', JSON.stringify(message));
            this.router.navigate(['/dashboard']);
        }

        // 6. Manejar Errores
        if (message.error || messageType === 'error') {
            const errorMsg = message.error || (message as any).message || 'Unknown error';
            console.error('❌ [RealTimeService] Error del servidor:', errorMsg);
            this.errorSubject.next({
                type: 'backend_error',
                message: errorMsg
            });
        }
    }
}
