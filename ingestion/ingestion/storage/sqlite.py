from __future__ import annotations

import sqlite3
from os import PathLike
from typing import Generator, TypeAlias

_StrOrBytesPath: TypeAlias = str | bytes | PathLike[str] | PathLike[bytes]


class SQLiteKVStore:
    conn: sqlite3.Connection

    def __init__(self, filename: _StrOrBytesPath):
        self.conn = sqlite3.connect(filename)
        self.conn.execute(
            f"CREATE TABLE IF NOT EXISTS kv (key text unique, value text)",
        )

    def close(self):
        self.conn.commit()
        self.conn.close()

    def __len__(self):
        rows = self.conn.execute("SELECT COUNT(*) FROM kv").fetchone()[0]
        return rows if rows is not None else 0

    def iterkeys(self) -> Generator[str, None, None]:
        c = self.conn.cursor()
        for row in c.execute("SELECT key FROM kv"):
            yield str(row[0])

    def itervalues(self) -> Generator[str, None, None]:
        c = self.conn.cursor()
        for row in c.execute("SELECT value FROM kv"):
            yield str(row[0])

    def iteritems(self) -> Generator[tuple[str, str], None, None]:
        c = self.conn.cursor()
        for row in c.execute("SELECT key, value FROM kv"):
            yield str(row[0]), str(row[1])

    def keys(self):
        return list(self.iterkeys())

    def values(self):
        return list(self.itervalues())

    def items(self):
        return list(self.iteritems())

    def contains(self, key: str):
        return (
            self.conn.execute("SELECT 1 FROM kv WHERE key = ?", (key,)).fetchone()
            is not None
        )

    def get(self, key: str):
        item = self.conn.execute(
            "SELECT value FROM kv WHERE key = ?", (key,)
        ).fetchone()
        if item is None:
            raise KeyError(key)
        return item[0]

    def set(self, key: str, value: str):
        self.conn.execute("REPLACE INTO kv (key, value) VALUES (?,?)", (key, value))

    def delete(self, key: str):
        if key not in self:
            raise KeyError(key)
        self.conn.execute("DELETE FROM kv WHERE key = ?", (key,))

    def __iter__(self):
        return self.iterkeys()
