from concurrent.futures import ThreadPoolExecutor

import pytest

from src.services.rate_limiter import RateLimiter


class FakeClock:
    def __init__(self, initial_time: float = 0) -> None:
        self.current_time = initial_time

    def __call__(self) -> float:
        return self.current_time

    def advance(self, seconds: float) -> None:
        self.current_time += seconds


@pytest.fixture
def clock():
    return FakeClock()


@pytest.fixture
def limiter(clock):
    return RateLimiter(max_attempts=5, window_seconds=900, clock=clock)


def test_first_five_failures_are_allowed_and_sixth_is_blocked(limiter):
    for _ in range(5):
        assert limiter.can_attempt("192.0.2.10")
        limiter.record_failure("192.0.2.10")

    assert not limiter.can_attempt("192.0.2.10")


def test_retry_after_reports_remaining_window_seconds(limiter, clock):
    for _ in range(5):
        limiter.record_failure("192.0.2.10")
        clock.advance(1)

    assert limiter.get_retry_after("192.0.2.10") == 895


def test_success_clears_previous_failures(limiter):
    for _ in range(4):
        limiter.record_failure("192.0.2.10")

    limiter.clear("192.0.2.10")

    for _ in range(5):
        assert limiter.can_attempt("192.0.2.10")
        limiter.record_failure("192.0.2.10")
    assert not limiter.can_attempt("192.0.2.10")


def test_each_ip_has_an_independent_counter(limiter):
    for _ in range(5):
        limiter.record_failure("192.0.2.10")

    assert not limiter.can_attempt("192.0.2.10")
    assert limiter.can_attempt("192.0.2.11")


def test_expired_failures_no_longer_block_and_are_removed(limiter, clock):
    for _ in range(5):
        limiter.record_failure("192.0.2.10")

    clock.advance(900)

    assert limiter.can_attempt("192.0.2.10")
    assert "192.0.2.10" not in limiter._failures


def test_concurrent_attempts_cannot_exceed_limit_for_one_ip(limiter):
    def attempt_failed_login(_):
        with limiter.lock_ip("192.0.2.10"):
            if not limiter.can_attempt("192.0.2.10"):
                return False
            limiter.record_failure("192.0.2.10")
            return True

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(attempt_failed_login, range(10)))

    assert sum(results) == 5
    assert not limiter.can_attempt("192.0.2.10")
