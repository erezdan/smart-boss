// MyLogger.js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase"; // Adjust import path as needed

const MyLogger = {
  // === ⚙️ Configuration Flags ===
  printLogs: true,
  printWarnings: true,
  printErrors: true,
  printTraces: true,

  // === 🔄 Internal State ===
  _queue: [],
  _isProcessing: false,
  _maxQueueSize: 50, // prevents memory leak if Firestore offline or blocked
  _retryDelay: 2000, // ms delay for retry after network/firestore errors

  /**
   * 🔁 Processes log queue sequentially.
   * Ensures only one process runs at a time.
   * Retries automatically on Firestore errors with exponential backoff.
   */
  async _processQueue() {
    if (this._isProcessing || !this._queue.length) return;
    this._isProcessing = true;

    while (this._queue.length) {
      const logItem = this._queue.shift();

      try {
        // ✅ Basic validation before sending
        if (!db || typeof addDoc !== "function") {
          console.warn(
            "[LOGGER] Firestore not initialized, skipping log:",
            logItem
          );
          continue;
        }

        // Prevent sending empty messages
        if (!logItem.message || !logItem.type) {
          console.warn("[LOGGER] Skipping invalid log item:", logItem);
          continue;
        }

        const logsRef = collection(db, "logs");
        await addDoc(logsRef, logItem);
      } catch (err) {
        console.error("[LOGGER FIRESTORE ERROR]", err);

        // Requeue failed log for retry (simple exponential backoff)
        this._queue.unshift(logItem);
        await new Promise((r) => setTimeout(r, this._retryDelay));
        this._retryDelay = Math.min(this._retryDelay * 2, 30000); // cap at 30s
        continue;
      }

      // Reset retry delay on success
      this._retryDelay = 2000;
    }

    this._isProcessing = false;
  },

  /**
   * 🧠 Queues a log for Firestore write (non-blocking).
   * Automatically enriches the entry with user info, timestamp, and context.
   */
  async _saveLogToFirestore(type, contextName = "general", ...args) {
    try {
      // Skip logs if Firestore not ready
      if (!db) {
        console.warn("[LOGGER] Firestore instance missing — skipping log");
        return;
      }

      // Serialize log message safely
      const message = args
        .map((a) => {
          try {
            if (a === undefined) return "undefined";
            if (a === null) return "null";
            if (typeof a === "object") return JSON.stringify(a);
            return String(a);
          } catch {
            return "[Unserializable Object]";
          }
        })
        .join(" ");

      // Ignore empty logs
      if (!message.trim()) return;

      const user = auth?.currentUser || null;
      const logDoc = {
        type,
        contextName,
        message,
        timestamp: serverTimestamp(),
        localTime: new Date().toISOString(),
      };

      if (user) {
        logDoc.userId = user.uid;
        logDoc.userName = user.displayName || "Unknown User";
      }

      // Prevent unbounded queue growth
      if (this._queue.length > this._maxQueueSize) {
        console.warn("[LOGGER] Queue full — dropping oldest log");
        this._queue.shift(); // drop oldest
      }

      this._queue.push(logDoc);
      this._processQueue(); // fire & forget
    } catch (err) {
      console.error("[LOGGER INTERNAL ERROR]", err);
    }
  },

  /**
   * 🟢 Regular log message (console only)
   */
  log(...args) {
    if (this.printLogs) console.log(...args);
  },

  /**
   * 🟠 Warning message
   */
  warning(...args) {
    if (this.printWarnings) console.warn("[WARNING]", ...args);
  },

  /**
   * 🔴 Error message — prints locally & logs to Firestore
   */
  error(contextName = "general", ...args) {
    if (this.printErrors) {
      console.error("[ERROR]", ...args);
      this._saveLogToFirestore("error", contextName, ...args);
    }
  },

  /**
   * 🔵 Trace message — prints locally & logs to Firestore
   */
  trace(contextName = "general", ...args) {
    if (this.printTraces) {
      console.debug("[TRACE]", ...args);
      this._saveLogToFirestore("trace", contextName, ...args);
    }
  },
};

export default MyLogger;
