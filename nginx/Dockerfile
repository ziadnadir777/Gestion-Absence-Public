FROM owasp/modsecurity-crs:nginx

# Supprime l'ancien fichier default.conf généré dynamiquement
RUN rm -f /etc/nginx/conf.d/default.conf

# Copie ton fichier statique par-dessus
COPY default.conf /etc/nginx/conf.d/custom.conf

# Empêche la régénération automatique via les scripts entrypoint
ENV DISABLE_TEMPLATE_GENERATION=true
