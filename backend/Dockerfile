FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends default-libmysqlclient-dev curl && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -m msea && mkdir -p /var/msea/uploads && chown -R msea /var/msea
USER msea
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD curl -fs http://127.0.0.1:8000/health || exit 1
# entrypoint runs migrations then gunicorn; SCHEDULER_ENABLED decides web vs scheduler role
CMD ["sh", "-c", "alembic upgrade head && gunicorn -c gunicorn.conf.py wsgi:app"]
