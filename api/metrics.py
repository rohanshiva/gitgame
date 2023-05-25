from prometheus_client import Histogram, Counter, Gauge
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi import FastAPI
from functools import wraps
from typing import Callable
import inspect

NAMESPACE = "gitgame"
SERVICE = "api"

MISC_FUNCTION_LATENCY = Histogram(
    "misc_function_latency",
    "Function latency (s)",
    ["name"],
    namespace=NAMESPACE,
    subsystem=SERVICE,
)
MISC_FUNCTION_SUCCESSFUL_CALLS = Counter(
    "misc_function_calls",
    "Function calls",
    ["name"],
    namespace=NAMESPACE,
    subsystem=SERVICE,
)
MISC_FUNCTION_ERRORS = Counter(
    "misc_function_errors",
    "Function errors",
    ["name", "error"],
    namespace=NAMESPACE,
    subsystem=SERVICE,
)

WS_CONNECTIONS = Gauge(
    "ws_connections",
    "Open Websocket Connections",
    namespace=NAMESPACE,
    subsystem=SERVICE,
)


def instrument(func: Callable):
    func_name = func.__name__

    @wraps(func)
    def sync_wrapper(*args, **kwargs):
        with MISC_FUNCTION_LATENCY.labels(func_name).time():
            try:
                result = func(*args, **kwargs)
                MISC_FUNCTION_SUCCESSFUL_CALLS.labels(func_name).inc()
                return result
            except Exception as e:
                MISC_FUNCTION_ERRORS.labels(func_name, type(e).__name__).inc()
                raise e

    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        with MISC_FUNCTION_LATENCY.labels(func_name).time():
            try:
                result = await func(*args, **kwargs)
                MISC_FUNCTION_SUCCESSFUL_CALLS.labels(func_name).inc()
                return result
            except Exception as e:
                MISC_FUNCTION_ERRORS.labels(func_name, type(e).__name__).inc()
                raise e

    if inspect.iscoroutinefunction(func):
        return async_wrapper
    return sync_wrapper


def attach_instrumentation(app: FastAPI):
    Instrumentator(excluded_handlers=[], should_group_status_codes=False).instrument(
        app, metric_namespace=NAMESPACE, metric_subsystem=SERVICE
    ).expose(app)
