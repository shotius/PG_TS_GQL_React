import { FieldError } from "resolvers/FieldError";
import { UserInputArgs } from "resolvers/UserInputArgs";

export const validateRegister = (
  options: UserInputArgs
): [FieldError] | null => {
  if (!options.email.includes("@")) {
    return [
      {
        field: "email",
        message: "email should include '@'",
      },
    ];
  }

  if (options.username.length <= 2) {
    return [
      {
        field: "username",
        message: "username must be more then 2 characters",
      },
    ];
  }
  if (options.password.length <= 3) {
    return [
      {
        field: "password",
        message: "password must be at least 4 characters",
      },
    ];
  }
  if (options.username.includes("@")) {
    return [
      {
        field: "username",
        message: "username cannot include '@' sign",
      },
    ];
  }
  return null;
};
