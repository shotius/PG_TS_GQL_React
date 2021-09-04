import { validateRegister } from './../utils/valideteRegister';
import { MyContext } from "types";
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { User } from "entities/User";
import argon2 from "argon2";
import { COOKIE_NAME } from "../constants";
import { UserInputArgs } from "./UserInputArgs";
import { FieldError } from "./FieldError";

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field({ nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  // me function
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    const id = req.session.userId;
    const user = await em.findOne(User, { id });
    return user;
  }

  // Register user
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UserInputArgs,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {

    const errors = validateRegister(options)
    if (errors) {
      return {errors}
    }    

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
      email: options.email,
      createdAt: new Date(),
    });
    try {
      await em.persistAndFlush(user);
    } catch (error) {
      if (error.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username already exists",
            },
          ],
        };
      }
    }
    return { user };
  }

  // User Login
  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {

    // find a user by username or email
    const user = await em.findOne(
      User,
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );

    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "Username not found",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "password is incorrect",
          },
        ],
      };
    }

    //   req.sessionID = String(user.id)
    req.session.userId = user.id;

    return {
      user,
    };
  }

  // logout
  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) => {
      res.clearCookie(COOKIE_NAME);
      req.session.destroy((err) => {
        if (err) {
          console.log("error", err);
          resolve(err);
          return;
        } else {
          resolve(true);
        }
      });
    });
  }

  @Mutation(() => Boolean)
  async forgotPassword(@Arg("email") email: string, @Ctx() { em }: MyContext) {
    // const user = await em.findOne(User, { email });
  }
}
