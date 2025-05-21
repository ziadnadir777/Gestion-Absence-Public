#!/bin/bash
echo "🔄 Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
./wait-for-it.sh $DB_HOST:$DB_PORT -- echo "✅ PostgreSQL is ready. Executing command..."
echo "⏳ Attente fixe pour laisser PostgreSQL démarrer..."
sleep 10

echo "🛠️ Initialisation de la base de données..."
python reset_db.py || echo "⚠️ reset_db.py échoué ou déjà exécuté"

echo "🚀 Lancement de l'application Flask..."
exec python app.py