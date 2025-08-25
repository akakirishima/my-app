FROM python:3.11-slim
WORKDIR /app

# Install deps first (cacheable)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App source (for non-volume builds)
COPY . .

# Flask settings
ENV FLASK_APP=app
ENV FLASK_RUN_HOST=0.0.0.0
EXPOSE 5000

# Run Flask dev server
CMD ["flask", "run", "--port", "5000"]
