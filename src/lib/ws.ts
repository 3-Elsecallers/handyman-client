const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8085/ws";

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const HEARTBEAT_INTERVAL_MS = 25_000;

type WSEventHandler = (data: unknown) => void;
type WSStatus = "connecting" | "open" | "closed";

interface WSMessage {
  event: string;
  data: unknown;
}

/**
 * WebSocket client for the communication-service realtime endpoint.
 * - Authenticates via JWT in the query string (matches server /ws?token=).
 * - Sends an application-level ping every heartbeat interval; the server
 *   responds with pong and terminates dead sockets on its side.
 * - Auto-reconnects with exponential backoff unless disconnected explicitly.
 */
class CommunicationSocket {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private handlers = new Map<string, Set<WSEventHandler>>();
  private reconnectAttempts = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closedByUser = false;

  get status(): WSStatus {
    if (!this.ws) return "closed";
    return this.ws.readyState === WebSocket.OPEN ? "open" : "connecting";
  }

  connect(token: string) {
    this.token = token;
    this.closedByUser = false;
    this.open();
  }

  on(event: string, handler: WSEventHandler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: WSEventHandler) {
    this.handlers.get(event)?.delete(handler);
  }

  send(event: string, data: Record<string, unknown> = {}) {
    if (this.status !== "open") return false;
    this.ws?.send(JSON.stringify({ event, data } satisfies WSMessage));
    return true;
  }

  disconnect() {
    this.closedByUser = true;
    this.clearTimers();
    this.ws?.close(1000, "Client disconnect");
    this.ws = null;
    this.handlers.clear();
  }

  private open() {
    const url = `${WS_URL}?token=${encodeURIComponent(this.token || "")}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.emit("open", {});
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        this.emit(msg.event, msg.data);
      } catch {
        this.emit("error", { message: "Malformed message from server" });
      }
    };

    ws.onclose = () => {
      this.stopHeartbeat();
      if (!this.closedByUser) this.scheduleReconnect();
    };

    ws.onerror = () => {
      this.emit("error", { message: "WebSocket error" });
    };
  }

  private scheduleReconnect() {
    const delay = Math.min(
      RECONNECT_BASE_MS * 2 ** this.reconnectAttempts,
      RECONNECT_MAX_MS,
    );
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => this.open(), delay);
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send("ping");
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearTimers() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private emit(event: string, data: unknown) {
    const handlers = this.handlers.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(data);
    }
  }
}

export const communicationSocket = new CommunicationSocket();
export default CommunicationSocket;