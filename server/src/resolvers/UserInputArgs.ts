import {
  Field,
  InputType
} from "type-graphql";


@InputType()
export class UserInputArgs {
  @Field()
  email: string;
  @Field()
  username: string;
  @Field()
  password: string;
}
