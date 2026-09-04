FROM python:3.11-slim

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

WORKDIR /app

# Install system dependencies needed for compiling certain python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/

RUN pip install --upgrade pip \
    && pip install -r requirements.txt

COPY . /app/

EXPOSE 8000

# Run migrations, seed sample data, and start the development server
CMD ["sh", "-c", "python manage.py migrate && python manage.py seed_data && python manage.py runserver 0.0.0.0:8000"]
