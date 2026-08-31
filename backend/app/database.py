import os

import psycopg
from psycopg.rows import dict_row


def get_database_url() -> str:
    database_url = os.getenv(
        "DATABASE_URL"
    )

    if not database_url:
        raise RuntimeError(
            "DATABASE_URL is not configured. "
            "Set it in the environment before "
            "starting the backend."
        )

    return database_url


def get_connection():
    return psycopg.connect(
        get_database_url(),
        row_factory=dict_row,
    )