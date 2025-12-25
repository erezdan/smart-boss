from management.supervisor import Supervisor
from utils.logger import logger


def main():
    logger.log("Application starting")

    supervisor = Supervisor(
        cameras_config_path="cameras_config.json"
    )

    supervisor.start()
    supervisor.run_forever()


if __name__ == "__main__":
    main()
