/**
 * @file app.js
 * @description Punto de entrada del servidor. Configuración de Express, Apollo y WebSockets.
 */

// 1. PARCHE DE SEGURIDAD (Debe ir en la línea 1)
// Corrige el error "crypto is not defined" en entornos Docker/Node antiguos
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

// Importaciones locales
const conectarDB = require('./config/db');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

async function startServer() {
    const app = express();
    app.use(cors()); // Permitir peticiones desde el frontend (puerto 3000)

    // Conectar a MongoDB Atlas
    await conectarDB();

    const schema = makeExecutableSchema({ typeDefs, resolvers });
    const httpServer = createServer(app);

    // Configuración del servidor Apollo
    const server = new ApolloServer({
        schema,
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

    // Configuración de WebSockets para Suscripciones en tiempo real
    const subscriptionServer = SubscriptionServer.create(
        { schema, execute, subscribe },
        { server: httpServer, path: server.graphqlPath }
    );

    const PORT = process.env.PORT || 4000;
    httpServer.listen(PORT, () => {
        console.log(`\n🚀 Servidor listo en http://localhost:${PORT}${server.graphqlPath}`);
        console.log(`🚀 Suscripciones en ws://localhost:${PORT}${server.graphqlPath}\n`);
    });
}

// Arrancar la aplicación
startServer().catch(err => {
    console.error('❌ Error fatal al arrancar el servidor:', err);
});