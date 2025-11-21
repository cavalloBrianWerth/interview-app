import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export enum WebSocketConnectionState {
  CONNECTING = 'CONNECTING',
  OPEN = 'OPEN',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED'
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private readonly messageSubject = new Subject<unknown>();
  private readonly errorSubject = new Subject<Event>();
  
  readonly connectionState = signal<WebSocketConnectionState>(WebSocketConnectionState.CLOSED);
  readonly messages$ = this.messageSubject.asObservable();
  readonly errors$ = this.errorSubject.asObservable();

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket is already connected');
      return;
    }

    this.connectionState.set(WebSocketConnectionState.CONNECTING);
    this.socket = new WebSocket(environment.wsUrl);

    this.socket.onopen = () => {
      this.connectionState.set(WebSocketConnectionState.OPEN);
      console.log('WebSocket connected');
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        this.messageSubject.next(data);
      } catch (error) {
        this.messageSubject.next(event.data);
      }
    };

    this.socket.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
      this.errorSubject.next(error);
    };

    this.socket.onclose = () => {
      this.connectionState.set(WebSocketConnectionState.CLOSED);
      console.log('WebSocket disconnected');
    };
  }

  disconnect(): void {
    if (this.socket) {
      this.connectionState.set(WebSocketConnectionState.CLOSING);
      this.socket.close();
      this.socket = null;
    }
  }

  send(message: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(data);
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}
