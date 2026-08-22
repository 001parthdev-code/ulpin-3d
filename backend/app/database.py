import os

import psycopg
from psycopg.rows import dict_row


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://ulpin:ulpin_dev_password@localhost:5432/ulpin",
)


def get_connection():
    return psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row,
    )