"""In-memory login rate limiting for a single application process.

This limiter is thread-safe within one process. Its state is not shared across
multiple worker processes or application instances; use shared storage for that
deployment model. Client IPs must come from the direct ASGI connection unless
trusted proxy handling is explicitly configured by the application server.
"""

from collections import deque
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from math import ceil
from threading import Lock
from time import monotonic


class RateLimiter:
    def __init__(
        self,
        max_attempts: int = 5,
        window_seconds: int = 15 * 60,
        clock: Callable[[], float] = monotonic,
    ) -> None:
        if max_attempts < 1:
            raise ValueError("max_attempts must be positive")
        if window_seconds < 1:
            raise ValueError("window_seconds must be positive")

        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._clock = clock
        self._failures: dict[str, deque[float]] = {}
        self._state_lock = Lock()
        self._ip_locks = {}
        self._ip_locks_guard = Lock()

    @contextmanager
    def lock_ip(self, ip_address: str) -> Iterator[None]:
        """Serialize authentication decisions for one IP without blocking others."""
        with self._ip_locks_guard:
            lock_entry = self._ip_locks.get(ip_address)
            if lock_entry is None:
                ip_lock = Lock()
                references = 0
            else:
                ip_lock, references = lock_entry
            self._ip_locks[ip_address] = (ip_lock, references + 1)

        ip_lock.acquire()
        try:
            yield
        finally:
            ip_lock.release()
            with self._ip_locks_guard:
                current_lock, references = self._ip_locks[ip_address]
                if references == 1:
                    del self._ip_locks[ip_address]
                else:
                    self._ip_locks[ip_address] = (current_lock, references - 1)

    def can_attempt(self, ip_address: str) -> bool:
        with self._state_lock:
            now = self._clock()
            self._purge_expired(now)
            return len(self._failures.get(ip_address, ())) < self.max_attempts

    def record_failure(self, ip_address: str) -> None:
        with self._state_lock:
            now = self._clock()
            self._purge_expired(now)
            self._failures.setdefault(ip_address, deque()).append(now)

    def clear(self, ip_address: str) -> None:
        with self._state_lock:
            self._purge_expired(self._clock())
            self._failures.pop(ip_address, None)

    def get_retry_after(self, ip_address: str) -> int:
        with self._state_lock:
            now = self._clock()
            self._purge_expired(now)
            failures = self._failures.get(ip_address)
            if failures is None or len(failures) < self.max_attempts:
                return 0

            expires_at = failures[0] + self.window_seconds
            return max(1, ceil(expires_at - now))

    def _purge_expired(self, now: float) -> None:
        cutoff = now - self.window_seconds
        for ip_address, failures in tuple(self._failures.items()):
            while failures and failures[0] <= cutoff:
                failures.popleft()
            if not failures:
                del self._failures[ip_address]


login_rate_limiter = RateLimiter()
