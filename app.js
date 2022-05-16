const fastify = require("fastify")({ logger: true });
// fastify.register(require('./plugin/mongo'))
fastify.register(require("@fastify/swagger"), {
  exposeRoute: true,
  routePrefix: "/docs",
  swagger: {
    info: { title: "keycloak-fastify" },
  },
  consumes: ['application/x-www-form-urlencoded']
});
// fastify.register(require("./routes/items"));

const PORT = 5000;

const start = async () => {
  try {
    await fastify.listen(PORT);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
