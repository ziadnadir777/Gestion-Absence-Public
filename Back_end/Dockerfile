FROM python:3.10-bookworm

# Installer les dépendances système pour psycopg2
RUN apt-get update && apt-get install -y postgresql-client

WORKDIR /app
COPY . .

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Rendre l'entrée exécutable
COPY wait-for-it.sh entrypoint.sh ./
RUN chmod +x wait-for-it.sh entrypoint.sh

# Lancer le script d’entrée
CMD ["./entrypoint.sh"]

EXPOSE 5000