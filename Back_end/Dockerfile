FROM python:3.10-bookworm

# Installer les dépendances système
RUN apt-get update && apt-get install -y postgresql-client netcat-openbsd dos2unix


WORKDIR /app

COPY . .

RUN dos2unix wait-for-it.sh entrypoint.sh && \
    chmod +x wait-for-it.sh entrypoint.sh

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

CMD ["./entrypoint.sh"]
