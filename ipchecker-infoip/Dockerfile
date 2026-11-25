FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/ ./src/
EXPOSE 5001
USER nobody
# gunicorn is a production WSGI server; Flask's built-in one is for development only.
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--chdir", "src", "app:app"]
