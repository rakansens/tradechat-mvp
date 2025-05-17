import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { logger } from '@/utils/common';
import { getApiConfig } from '@/config/environment';

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting'
}

export interface ReconnectConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
}

export interface ConnectionManagerOptions {
  wsUrl?: string;
  reconnectConfig?: Partial<ReconnectConfig>;
}

export class ConnectionManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly reconnectConfig: ReconnectConfig = {
    maxAttempts: 10,
    baseDelay: 1000,
    maxDelay: 30000,
    jitter: true
  };
  private readonly wsUrl: string;

  constructor(options: ConnectionManagerOptions = {}) {
    super();
    this.wsUrl = options.wsUrl || getApiConfig('bitget').wsUrl;
    if (options.reconnectConfig) {
      Object.assign(this.reconnectConfig, options.reconnectConfig);
    }
  }

  public connect(): void {
    if (
      this.state === ConnectionState.CONNECTED ||
      this.state === ConnectionState.CONNECTING
    ) {
      logger.info('WebSocket is already connected or connecting', {
        component: 'ConnectionManager',
        action: 'connect'
      });
      return;
    }

    this.state = ConnectionState.CONNECTING;

    try {
      logger.info(`Connecting to Bitget WebSocket: ${this.wsUrl}`, {
        component: 'ConnectionManager',
        action: 'connect'
      });

      this.ws = new WebSocket(this.wsUrl);

      this.ws.on('open', this.handleOpen.bind(this));
      this.ws.on('message', (data) => this.emit('message', data));
      this.ws.on('error', this.handleError.bind(this));
      this.ws.on('close', this.handleClose.bind(this));
      this.ws.on('ping', (data) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.pong(data);
        }
      });
    } catch (error) {
      logger.error('Failed to connect to WebSocket', error, {
        component: 'ConnectionManager',
        action: 'connect'
      });
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    logger.info('Disconnecting from Bitget WebSocket', {
      component: 'ConnectionManager',
      action: 'disconnect'
    });

    this.clearTimers();

    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }

    this.state = ConnectionState.DISCONNECTED;
  }

  public send(data: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  public sendPing(): void {
    this.send('ping');
  }

  public sendPong(): void {
    this.send('pong');
  }

  public getState(): ConnectionState {
    return this.state;
  }

  public isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED;
  }

  private handleOpen(): void {
    logger.info('WebSocket connection established', {
      component: 'ConnectionManager',
      action: 'handleOpen'
    });

    this.state = ConnectionState.CONNECTED;
    this.reconnectAttempts = 0;
    this.emit('open');
  }

  private handleError(error: Error): void {
    logger.error('WebSocket error', error, {
      component: 'ConnectionManager',
      action: 'handleError'
    });
    this.emit('error', error);
  }

  private handleClose(code: number, reason: Buffer): void {
    logger.info(`WebSocket connection closed: ${code} ${reason.toString()}`, {
      component: 'ConnectionManager',
      action: 'handleClose'
    });

    this.clearTimers();
    this.ws = null;

    if (code !== 1000) {
      this.scheduleReconnect();
    } else {
      this.state = ConnectionState.DISCONNECTED;
    }

    this.emit('close', { code, reason: reason.toString() });
  }

  private scheduleReconnect(): void {
    if (this.ws) {
      try {
        this.ws.terminate();
      } catch (error) {
        logger.warn(`Error terminating WebSocket connection: ${error}`, {
          component: 'ConnectionManager',
          action: 'scheduleReconnect'
        });
      }
      this.ws = null;
    }

    if (this.reconnectTimer || this.state === ConnectionState.RECONNECTING) {
      return;
    }

    this.state = ConnectionState.RECONNECTING;

    if (this.reconnectAttempts >= this.reconnectConfig.maxAttempts) {
      logger.error(
        `Maximum reconnection attempts (${this.reconnectConfig.maxAttempts}) reached`,
        {
          component: 'ConnectionManager',
          action: 'scheduleReconnect'
        }
      );
      this.state = ConnectionState.DISCONNECTED;
      this.emit('reconnect_failed');
      return;
    }

    const delay = this.calculateReconnectDelay();

    logger.info(
      `Scheduling reconnect in ${delay}ms (attempt ${
        this.reconnectAttempts + 1
      }/${this.reconnectConfig.maxAttempts})`,
      {
        component: 'ConnectionManager',
        action: 'scheduleReconnect'
      }
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;

      logger.info(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.reconnectConfig.maxAttempts})`,
        {
          component: 'ConnectionManager',
          action: 'reconnect'
        }
      );

      this.connect();
    }, delay);
  }

  private calculateReconnectDelay(): number {
    const { baseDelay, maxDelay, jitter } = this.reconnectConfig;
    const exponentialDelay = Math.min(
      maxDelay,
      baseDelay * Math.pow(2, this.reconnectAttempts)
    );

    if (jitter) {
      const jitterMultiplier = 0.5 + Math.random();
      return Math.floor(exponentialDelay * jitterMultiplier);
    }
    return exponentialDelay;
  }

  private clearTimers(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export default ConnectionManager;
