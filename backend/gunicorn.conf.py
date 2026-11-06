import multiprocessing, os
bind = "0.0.0.0:8000"
workers = int(os.getenv("GUNICORN_WORKERS", max(2, multiprocessing.cpu_count())))
threads = int(os.getenv("GUNICORN_THREADS", "4"))
timeout = 60
accesslog = "-"
errorlog = "-"
forwarded_allow_ips = "*"
