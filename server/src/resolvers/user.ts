import { validateRegister } from "./../utils/valideteRegister";
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
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { UserInputArgs } from "./UserInputArgs";
import { FieldError } from "./FieldError";
import { v4 } from "uuid";
import { sendEmail } from "utils/sendMail";
import { getConnection } from "typeorm";

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
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    const id = req.session.userId;
    return User.findOne(id);
  }

  @Query(() => [User], { nullable: true })
  async users(): Promise<User[]> {
    const users = User.find({});
    return users;
  }

  // Register user
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UserInputArgs
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);
    let user;
    try {
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: options.username,
          password: hashedPassword,
          email: options.email,
        })
        .returning("*")
        .execute();
      console.log("result: ", result);
      user = (await result).raw[0];
    } catch (error) {
      if (error.code === "23505") {
        console.log(error);
        return {
          errors: [
            {
              field: "username",
              message: "username already exists",
            },
            {
              field: "email",
              message: "email already exist",
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
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    // find a user by username or email
    const user = await User.findOne(
      usernameOrEmail.includes("@")
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );

    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
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

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis }: MyContext
  ): Promise<UserResponse> {
    // validate password
    if (newPassword.length < 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "message must be longer then 2 characters",
          },
        ],
      };
    }

    // validate userid by token in redis
    const key = FORGOT_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired or invalid",
          },
        ],
      };
    }

    // check for user
    const userIdNum = parseInt(userId);
    const user = await User.findOne(userIdNum);
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user not found",
          },
        ],
      };
    }

    // delete token from redis to not to reuse it
    await redis.del(key);

    // change user password
    const updatedUser = await User.update(
      { id: userIdNum },
      { password: await argon2.hash(newPassword) }
    );

    console.log("updatedUser", updatedUser);

    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return true;
    }

    const token = v4();

    await redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60
    );

    await sendEmail(
      user.email,
      `<a href="http://localhost:3000/change-password/${token}">change a password</a>`
    );

    return true;
  }
}
