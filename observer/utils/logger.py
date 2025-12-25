import os
from datetime import datetime
from threading import Lock


class _Logger:
    """
    Simple local file-based logger (dev & edge).
    """

    BASE_LOG_DIR = r"c:\smart-boss-files\logs"

    def __init__(self):
        self._lock = Lock()

    def _ensure_log_dir_exists(self):
        os.makedirs(self.BASE_LOG_DIR, exist_ok=True)

    def _get_log_file_path(self) -> str:
        today = datetime.now().strftime("%Y-%m-%d")
        return os.path.join(self.BASE_LOG_DIR, f"{today}-logs.txt")

    def _write(self, level: str, message: str):
        self._ensure_log_dir_exists()

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_line = f"[{timestamp}] [{level.upper()}] {message}\n"

        with self._lock:
            with open(self._get_log_file_path(), "a", encoding="utf-8") as f:
                f.write(log_line)

    def log(self, message: str):
        self._write("log", message)

    def warning(self, message: str):
        self._write("warning", message)

    def error(self, message: str):
        self._write("error", message)


# Singleton logger instance
logger = _Logger()
