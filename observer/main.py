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

    try:
        supervisor = Supervisor(
            cameras_config_path=CONFIG_PATH
        )
    except Exception as e:
        # Fatal: application cannot start without a supervisor
        logger.error("Failed to initialize Supervisor", exc_info=e)
        return

    try:
        supervisor.start()
    except Exception as e:
        # Fatal: startup sequence failed
        logger.error("Supervisor failed during start()", exc_info=e)
        return

    try:
        if supervisor.qt_app:
            supervisor.qt_app.exec()
        else:
            supervisor.run_forever()
    except Exception as e:
        # Fatal: main execution loop crashed
        logger.error("Supervisor main loop crashed", exc_info=e)

if __name__ == "__main__":
    main()
