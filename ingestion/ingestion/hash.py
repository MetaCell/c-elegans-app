from __future__ import annotations

import base64
import struct
from io import BufferedIOBase

from crc32c import crc32c


class Crc32cCalculator(BufferedIOBase):
    """The Google Python client doesn't provide a way to stream a file being
    written, so we can wrap the file object in an additional class to
    do custom handling. This is so we don't need to download the file
    and then stream read it again to calculate the hash.

    Based on: https://vsoch.github.io/2020/crc32c-validation-google-storage/
    """

    def __init__(self, fileobj):
        self._fileobj = fileobj
        self.digest = 0

    def write(self, b) -> int:
        r = self._fileobj.write(b)
        self._update(b)
        return r

    def read(self, size: int | None = None):
        r = self._fileobj.read(size)
        self._update(r)
        return r

    def _update(self, chunk):
        """Given a chunk from the read in file, update the hexdigest"""
        if isinstance(chunk, str):
            chunk = chunk.encode("utf-8")
        self.digest = crc32c(chunk, self.digest)

    def hexdigest(self) -> str:
        """Return the hexdigest of the hasher.
        The Base64 encoded CRC32c is in big-endian byte order.
        See https://cloud.google.com/storage/docs/hashes-etags
        """
        return base64.b64encode(struct.pack(">I", self.digest)).decode("utf-8")
