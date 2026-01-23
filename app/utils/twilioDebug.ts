/**
 * Simple Twilio Call Debug Logger
 * Add this to see what's happening with Twilio calls
 */

export class TwilioDebug {
  private static logs: Array<{
    timestamp: Date;
    type: string;
    message: string;
    data?: any;
  }> = [];

  static log(type: string, message: string, data?: any) {
    const entry = {
      timestamp: new Date(),
      type,
      message,
      data,
    };

    this.logs.push(entry);

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    // Always console log
    const emoji = this.getEmoji(type);
    const timeStr = entry.timestamp.toLocaleTimeString();

    if (data) {
      console.log(`${emoji} [${timeStr}] [${type}] ${message}`, data);
    } else {
      console.log(`${emoji} [${timeStr}] [${type}] ${message}`);
    }
  }

  private static getEmoji(type: string): string {
    const emojiMap: { [key: string]: string } = {
      CALL_START: "📞",
      CALL_CONNECT: "✅",
      CALL_END: "📴",
      CALL_ERROR: "❌",
      TOKEN_REQUEST: "🔑",
      TOKEN_SUCCESS: "✅",
      TOKEN_ERROR: "❌",
      SDK_INIT: "🚀",
      SDK_ERROR: "❌",
      WEBHOOK: "🔔",
    };
    return emojiMap[type] || "📋";
  }

  static getLogs() {
    return [...this.logs];
  }

  static getRecentLogs(count: number = 20) {
    return this.logs.slice(-count);
  }

  static clearLogs() {
    this.logs = [];
    console.log("🗑️ Twilio debug logs cleared");
  }

  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Quick status check
  static printStatus() {
    console.log(
      "\n==================== TWILIO DEBUG STATUS ===================="
    );
    console.log(`Total logs: ${this.logs.length}`);
    console.log(
      `Last log: ${this.logs[this.logs.length - 1]?.message || "None"}`
    );
    console.log("Recent activity:");
    this.getRecentLogs(5).forEach((log) => {
      console.log(
        `  ${log.timestamp.toLocaleTimeString()} [${log.type}] ${log.message}`
      );
    });
    console.log(
      "=============================================================\n"
    );
  }
}

// Helper functions for common logging patterns
export const logCallStart = (from: string, to: string) => {
  TwilioDebug.log("CALL_START", `Initiating call from ${from} to ${to}`, {
    from,
    to,
  });
};

export const logCallConnected = (callSid?: string) => {
  TwilioDebug.log(
    "CALL_CONNECT",
    `Call connected ${callSid ? `(SID: ${callSid})` : ""}`,
    { callSid }
  );
};

export const logCallEnd = (duration?: number) => {
  TwilioDebug.log(
    "CALL_END",
    `Call ended ${duration ? `(Duration: ${duration}s)` : ""}`,
    { duration }
  );
};

export const logCallError = (error: any) => {
  TwilioDebug.log("CALL_ERROR", `Call error: ${error.message || error}`, error);
};

export const logTokenRequest = (fromNumber: string) => {
  TwilioDebug.log("TOKEN_REQUEST", `Requesting token for ${fromNumber}`, {
    fromNumber,
  });
};

export const logTokenSuccess = (identity: string) => {
  TwilioDebug.log("TOKEN_SUCCESS", `Token received for ${identity}`, {
    identity,
  });
};

export const logTokenError = (error: any) => {
  TwilioDebug.log(
    "TOKEN_ERROR",
    `Token error: ${error.message || error}`,
    error
  );
};
