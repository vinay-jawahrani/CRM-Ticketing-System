import multiprocessing
import os

workers = int(os.getenv("WORKERS", multiprocessing.cpu_count() * 2 + 1))
worker_class = "uvicorn.workers.UvicornWorker"
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
accesslog = "-"
errorlog = "-"
loglevel = "info"
timeout = 120
graceful_timeout = 30
keepalive = 5
preload_app = True