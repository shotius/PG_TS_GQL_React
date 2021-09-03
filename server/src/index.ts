import "reflect-metadata";
import { MyContext } from './types';
import { UserResover } from "./resolvers/user";
import { PostResolver } from "./resolvers/post";
import { HelloResolver } from "./resolvers/hello";
import { MikroORM } from "@mikro-orm/core";
import { COOKIE_NAME, __prod__ } from "./constants";
import config from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import redis from "redis";
import session from 'express-session';
import connectRedis from "connect-redis";
import cors from 'cors'

declare module 'express-session' {
  export interface SessionData {
    userId: number;
  }
}

// I use 'exress-session' for cookies
// and 'connect-redis'for cookie storage on the server

const main = async () => {
  // initialize ORM and run migrations - 'up'
  const orm = await MikroORM.init(config);
  await orm.getMigrator().up();

  // initialize redis
  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

  const app = express();

  app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
  }))
  // session middleware for session cookies
  // it saves userId in the browser and send the {userId: id}
  // to the redis store
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redisClient, disableTouch: true, }),
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365, // expire in 10 years
        httpOnly: true,
        sameSite: "lax",
        secure: __prod__
      },
      secret: "keyboard cat",
      resave: false,
    })
  );

  // initialize apollo server
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResover],
      validate: false,
    }), 
    context: ({req, res}): MyContext => ({ em: orm.em, req, res }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000, () => console.log("server is running on port 4000"));
};

main();
