# Paso 1: Usar una imagen de Nginx para servir archivos estáticos
FROM nginx:alpine

# Borramos los archivos por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiamos el contenido de tu carpeta 'src' (donde está tu HTML/JS del Producto 2)
# al directorio que Nginx usa para servir contenido
COPY ./src /usr/share/nginx/html

# Exponemos el puerto 80 (puerto por defecto de Nginx)
EXPOSE 80

# Arrancamos Nginx
CMD ["nginx", "-g", "daemon off;"]