import { Options } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import path from 'path'

const config: Options = {
  migrations: {
    path: path.join(__dirname, './migrations'),
    pattern: /^[\w-]+\d+\.[jt]s$/
  },
  entities: [Post],
  dbName: "codingpab",
  user: "postgres",
  password: "1234",
  type: "postgresql",
  debug: !__prod__,
};
export default config;
