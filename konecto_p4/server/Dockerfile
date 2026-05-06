# Usamos una imagen ligera de Node
FROM node:18-slim

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código del servidor
COPY . .

# Exponemos el puerto de Apollo Server (4000)
EXPOSE 4000

# Comando para arrancar
CMD ["npm", "start"]