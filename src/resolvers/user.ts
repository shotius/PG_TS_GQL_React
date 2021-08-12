import { MyContext } from "types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";
import { User } from "entities/User";
import argon2 from "argon2";

@InputType()
class UserInputArgs {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
    @Field()
    field: string
    @Field()
    message: string
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[]
    @Field({nullable: true})
    user?: User
}

@Resolver()
export class UserResover {
  // Register user
  @Mutation(() => User)
  async register(
    @Arg("options") options: UserInputArgs,
    @Ctx() { em }: MyContext
  ) {
    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });
    await em.persistAndFlush(user);
    return user;
  }

  // User Login
  @Mutation(() => UserResponse)
  async login(
      @Arg("options") options: UserInputArgs,
      @Ctx() { em } : MyContext
  ): Promise<UserResponse> {
      const user = await em.findOne(User, {username: options.username})
      if (!user) {
          return {
              errors: [{
                  field: "username",
                  message: "Username not found"
              }]
          }
      }
      const valid = await argon2.verify(user.password, options.password)
      if (!valid) {
          return {
              errors: [{
                  field: "password",
                  message: "password is incorrect"
              }]
          }
      }
      return {
          user
      }
  }
}
