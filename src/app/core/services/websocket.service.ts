import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WebSocketMessage {
    type: string;
    [key: string]: any;
}

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private socket: WebSocket | null = null;
    private messagesSubject = new Subject<WebSocketMessage>();
    private connectionStatusSubject = new BehaviorSubject<boolean>(false);

    public messages$ = this.messagesSubject.asObservable();
    public connectionStatus$ = this.connectionStatusSubject.asObservable();

    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;

    constructor() { }

    // Connect to WebSocket server
    connect(sessionId: string): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        const wsUrl = `${environment.wsUrl}/ws/session/${sessionId}/`;
        console.log('Connecting to WebSocket:', wsUrl);

        try {
            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.connectionStatusSubject.next(true);
                this.reconnectAttempts = 0;
            };

            this.socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('WebSocket message received:', message);
                    this.messagesSubject.next(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            this.socket.onclose = () => {
                console.log('WebSocket disconnected');
                this.connectionStatusSubject.next(false);
                this.attemptReconnect(sessionId);
            };

        } catch (error) {
            console.error('Error creating WebSocket:', error);
            this.connectionStatusSubject.next(false);
        }
    }

    // Send message to WebSocket server
    send(message: WebSocketMessage): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
            console.log('WebSocket message sent:', message);
        } else {
            console.error('WebSocket is not connected');
        }
    }

    // Disconnect from WebSocket
    disconnect(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.connectionStatusSubject.next(false);
        }
    }

    // Check if connected
    isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }

    // Attempt to reconnect
    private attemptReconnect(sessionId: string): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

            setTimeout(() => {
                this.connect(sessionId);
            }, this.reconnectDelay);
        } else {
            console.error('Max reconnect attempts reached');
        }
    }
}
