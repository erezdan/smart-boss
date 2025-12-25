import os
from management.supervisor import Supervisor
from utils.logger import logger

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CONFIG_PATH = os.path.join(
    BASE_DIR,
    "config",
    "cameras_config.json"
)

def main():
    logger.log("Application starting")

    supervisor = Supervisor(
        cameras_config_path=CONFIG_PATH
    )

    supervisor.start()

    if supervisor.qt_app:
        supervisor.qt_app.exec()
    else:
        supervisor.run_forever()

if __name__ == "__main__":
    main()
