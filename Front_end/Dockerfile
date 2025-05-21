# Utilise une image Node légère
FROM node:18-alpine

# Crée un répertoire de travail
WORKDIR /app

# Copie les fichiers
COPY . .

# Installe les dépendances (en cas de besoin)
RUN npm install --legacy-peer-deps

# Compile le frontend Expo pour le Web
RUN npm run build:web

# Installe un serveur statique
RUN npm install -g serve

# Utilise le dossier dist généré
WORKDIR /app/dist

# Expose le port (3000 par défaut pour serve)
EXPOSE 3000

# Commande de démarrage
CMD ["serve", "-s", ".", "-l", "3000"]
