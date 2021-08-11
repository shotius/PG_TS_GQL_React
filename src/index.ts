import "reflect-metadata";
import { PostResolver } from './resolvers/post';
import { HelloResolver } from "./resolvers/hello";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import config from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";

const main = async () => {
  const orm = await MikroORM.init(config);
  await orm.getMigrator().up();

  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver],
      validate: false,
    }),
    context: () => ({em: orm.em})
  });

  apolloServer.applyMiddleware({ app });
  await app.listen(4000, () => console.log("server is running on port 4000"));
};

main();
