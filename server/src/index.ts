import "reflect-metadata";
import { MyContext } from './types';
import { UserResolver } from "./resolvers/user";
import { PostResolver } from "./resolvers/post";
import { HelloResolver } from "./resolvers/hello";
import { COOKIE_NAME, __prod__ } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import Redis from "ioredis";
import session from 'express-session';
import connectRedis from "connect-redis";
import cors from 'cors'
import {createConnection} from 'typeorm'
import { User } from "./entities/User";
import { Post } from "./entities/Post";


declare module 'express-session' {
  export interface SessionData {
    userId: number;
  }
}

// I use 'exress-session' for cookies
// and 'connect-redis'for cookie storage on the server

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    database: "pg_gql_react_ts",
    username: "postgres",
    password: "1234",
    logging: true,
    synchronize: true,
    entities: [User, Post]
  })

  // initialize redis
  const RedisStore = connectRedis(session);
  const redis = new Redis()

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
      store: new RedisStore({ client: redis, disableTouch: true, }),
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
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }), 
    context: ({req, res}): MyContext => ({ req, res, redis }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000, () => console.log("server is running on port 4000"));
};

main();
