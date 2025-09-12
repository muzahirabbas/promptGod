
# Use the official lightweight Python image.
# https://hub.docker.com/_/python
FROM python:3.11-slim

# Allow statements and log messages to be sent straight to the logs
# without being buffered.
ENV PYTHONUNBUFFERED True

# Set the working directory in the container.
WORKDIR /app

# Copy over the requirements.txt file and install dependencies.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code.
COPY . .

# Run the web service on container startup.
# Use gunicorn for production.
# The --bind 0.0.0.0:8080 is important for Cloud Run.
CMD exec gunicorn --bind 0.0.0.0:8080 --workers 1 --threads 8 --timeout 0 main:app
