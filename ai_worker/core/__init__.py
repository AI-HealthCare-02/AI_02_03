import logging
import sys

from ai_worker.core.config import Config


def get_config() -> Config:
    return Config()


def setup_logger(name: str = "ai_worker", level: int = logging.INFO) -> logging.Logger:
    _logger = logging.getLogger(name)
    if _logger.handlers:
        return _logger
    _logger.setLevel(level)
    formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s")
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    _logger.addHandler(console_handler)
    _logger.propagate = False
    return _logger


def get_logger() -> logging.Logger:
    return setup_logger()


config = get_config()
default_logger = get_logger()
