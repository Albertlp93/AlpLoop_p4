/**
 * @file app.js
 * @description Punto de entrada del servidor. Configuración de Express, Apollo, GraphQL Subscriptions y Socket.io.
 */

if (typeof global.crypto === 'undefined') {
    global.crypto = require('crypto');
}

const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { createServer } = require('http');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const cors = require('cors');
const { Server } = require("socket.io"); // <--- AÑADIDO: Importar Socket.io

const conectarDB = require('./config/db');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

async function startServer() {
    const app = express();
    app.use(cors());

    await conectarDB();

    const schema = makeExecutableSchema({ typeDefs, resolvers });
    const httpServer = createServer(app);

    // --- CONFIGURACIÓN DE SOCKET.IO (Requerido por el Producto 4) ---
    const io = new Server(httpServer, {
        cors: { origin: "*" } // Permitir conexiones desde cualquier origen en pruebas
    });

    io.on('connection', (socket) => {
        console.log('📡 Nuevo cliente conectado vía Socket.io');
        
        // Ejemplo de evento: cuando alguien publica, avisamos a todos
        socket.on('nueva_publicacion', (data) => {
            io.emit('actualizar_muro', data);
        });
    });

    // Inyectamos io en el contexto de Apollo por si lo necesitas en los resolvers
    const server = new ApolloServer({
        schema,
        context: ({ req }) => ({ req, io }), 
        plugins: [{
            async serverWillStart() {
                return {
                    async drainServer() {
                        subscriptionServer.close();
                    }
                };
            }
        }],
    });

    await server.start();
    server.applyMiddleware({ app });

    const subscriptionServer = SubscriptionServer.create(
        { schema, execute, subscribe },
        { server: httpServer, path: server.graphqlPath }
    );

    const PORT = process.env.PORT || 4000;
    httpServer.listen(PORT, () => {
        console.log(`\n🚀 Servidor listo en http://localhost:${PORT}${server.graphqlPath}`);
        console.log(`📡 GraphQL WS en ws://localhost:${PORT}${server.graphqlPath}`);
        console.log(`📡 Socket.io listo en el mismo puerto\n`);
    });
}

startServer().catch(err => {
    console.error('❌ Error fatal:', err);
});