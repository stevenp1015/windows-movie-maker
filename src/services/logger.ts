// Enhanced logging service for the application

export type LogType =
  | "api"
  | "pipeline"
  | "generation"
  | "validation"
  | "error"
  | "info"
  | "success"
  | "warning";
export type LogSeverity = "low" | "medium" | "high" | "critical";

export interface EnhancedLog {
  id: string;
  timestamp: number;
  type: LogType;
  severity: LogSeverity;
  message: string;
  details?: Record<string, any>;
  duration?: number; // For API calls
  metadata?: {
    model?: string;
    sceneIndex?: number;
    entityId?: string;
    requestSize?: number;
    responseSize?: number;
  };
}

class LoggingService {
  private logs: EnhancedLog[] = [];
  private listeners: Set<(logs: EnhancedLog[]) => void> = new Set();
  private maxLogs = 500; // Keep last 500 logs

  subscribe(listener: (logs: EnhancedLog[]) => void) {
    this.listeners.add(listener);
    listener(this.logs); // Send current logs immediately
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.logs]));
  }

  log(
    type: LogType,
    severity: LogSeverity,
    message: string,
    details?: Record<string, any>,
    metadata?: EnhancedLog["metadata"]
  ) {
    const log: EnhancedLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      severity,
      message,
      details: details ? this.truncateDetails(details) : undefined,
      metadata,
    };

    this.logs.push(log);

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.notify();

    // Also log to console for devtools users
    const consoleMethod =
      severity === "critical" || type === "error"
        ? "error"
        : severity === "high"
        ? "warn"
        : "log";
    console[consoleMethod](`[${type.toUpperCase()}]`, message, details || "");
  }

  // Truncate large data for UI display
  private truncateDetails(details: Record<string, any>): Record<string, any> {
    const truncated: Record<string, any> = {};

    for (const [key, value] of Object.entries(details)) {
      if (typeof value === "string") {
        if (value.startsWith("data:image") || value.startsWith("iVBORw")) {
          // Base64 image
          const size = Math.round((value.length * 0.75) / 1024); // Rough KB estimate
          truncated[key] = `[IMAGE_DATA: ${size}KB]`;
        } else if (value.length > 200) {
          truncated[key] = `${value.substring(0, 200)}... (${
            value.length
          } chars total)`;
        } else {
          truncated[key] = value;
        }
      } else if (typeof value === "object" && value !== null) {
        const keys = Object.keys(value);
        truncated[key] = `{...${keys.length} keys: ${keys
          .slice(0, 3)
          .join(", ")}${keys.length > 3 ? "..." : ""}}`;
      } else {
        truncated[key] = value;
      }
    }

    return truncated;
  }

  // API call tracking
  startApiCall(
    model: string,
    requestType: string,
    requestSize?: number
  ): string {
    const callId = `api-${Date.now()}`;
    this.log(
      "api",
      "low",
      `${model} → ${requestType}`,
      { callId },
      { model, requestSize }
    );
    return callId;
  }

  endApiCall(
    callId: string,
    success: boolean,
    responseSize?: number,
    error?: string
  ) {
    const startLog = this.logs.find((l) => l.details?.callId === callId);
    const duration = startLog ? Date.now() - startLog.timestamp : 0;

    this.log(
      "api",
      success ? "low" : "high",
      success
        ? `✓ Response received (${duration}ms)`
        : `✗ API call failed: ${error}`,
      { callId, duration, responseSize, error },
      { responseSize }
    );
  }

  // Convenience methods
  apiCall(model: string, requestType: string, details?: Record<string, any>) {
    this.log("api", "low", `${model} → ${requestType}`, details, { model });
  }

  generation(message: string, details?: Record<string, any>) {
    this.log("generation", "medium", message, details);
  }

  pipeline(message: string, details?: Record<string, any>) {
    this.log("pipeline", "medium", message, details);
  }

  validation(message: string, passed: boolean, details?: Record<string, any>) {
    this.log("validation", passed ? "low" : "medium", message, details);
  }

  error(message: string, error?: any) {
    this.log("error", "critical", message, {
      error: error?.message || String(error),
    });
  }

  success(message: string, details?: Record<string, any>) {
    this.log("success", "low", message, details);
  }

  info(message: string, details?: Record<string, any>) {
    this.log("info", "low", message, details);
  }

  warning(message: string, details?: Record<string, any>) {
    this.log("warning", "medium", message, details);
  }

  clear() {
    this.logs = [];
    this.notify();
  }

  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new LoggingService();
