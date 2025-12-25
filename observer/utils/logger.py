import os
import sys
import traceback
from datetime import datetime
from threading import Lock


class _Logger:
    """
    Simple, crash-safe, file-based logger.
    Designed for 24/7 edge and long-running services.
    Must never raise exceptions.
    """

    BASE_LOG_DIR = r"c:\smart-boss-files\logs"

    def __init__(self):
        self._lock = Lock()

    def _ensure_log_dir_exists(self):
        try:
            os.makedirs(self.BASE_LOG_DIR, exist_ok=True)
        except Exception:
            # Absolutely nothing should break logging
            pass

    def _get_log_file_path(self) -> str:
        today = datetime.now().strftime("%Y-%m-%d")
        return os.path.join(self.BASE_LOG_DIR, f"{today}-logs.txt")

    def _format_message(self, level: str, message: str) -> str:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return f"[{timestamp}] [{level.upper()}] {message}"

    def _write(self, level: str, message: str, exc_info=None):
        try:
            self._ensure_log_dir_exists()

            log_lines = []

            base_line = self._format_message(level, message)
            log_lines.append(base_line)

            if exc_info:
                try:
                    if isinstance(exc_info, BaseException):
                        tb = "".join(
                            traceback.format_exception(
                                type(exc_info),
                                exc_info,
                                exc_info.__traceback__,
                            )
                        )
                    else:
                        tb = "".join(traceback.format_exception(*exc_info))
                    log_lines.append(tb.rstrip())
                except Exception:
                    log_lines.append("<<Failed to format exception>>")

            final_text = "\n".join(log_lines) + "\n"

            # Always print to stdout (useful for Docker / services)
            try:
                sys.stdout.write(final_text)
                sys.stdout.flush()
            except Exception:
                pass

            # File write must be thread-safe
            with self._lock:
                try:
                    with open(
                        self._get_log_file_path(),
                        "a",
                        encoding="utf-8",
                        buffering=1,
                    ) as f:
                        f.write(final_text)
                        f.flush()
                except Exception:
                    # Disk errors must never propagate
                    pass

        except Exception:
            # Ultimate safety net: logger must never crash
            pass

    def log(self, message: str):
        self._write("log", message)

    def warning(self, message: str):
        self._write("warning", message)

    def error(self, message: str, exc_info=None):
        """
        Log an error.
        exc_info can be:
        - an Exception instance
        - sys.exc_info()
        """
        self._write("error", message, exc_info=exc_info)


# Singleton logger instance
logger = _Logger()
