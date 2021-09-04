import { Button } from "@chakra-ui/button";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import React from "react";
import { InputField } from "../../components/InputField";
import { Wrapper } from "../../components/Wrapper";
import { useChangePasswordMutation } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { toErrorMap } from "../../utils/toErrorMap";

const ChangePassword: NextPage<{ token: string }> = ({ token }) => {
  const [, changePassword] = useChangePasswordMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ newPassword: "" }}
        onSubmit={async (values, {setErrors}) => {
          // change password request
          const response = await changePassword({
            newPassword: values.newPassword,
            token: token,
          });

          if (response.data?.changePassword.errors) {
            setErrors(toErrorMap(response.data.changePassword.errors))
          }
          return true;
        }}
      >
        {() => (
          <Form>
            <InputField
              name="newPassword"
              label="New Password"
              placeholder="New Password"
              type="password"
            />
            <Button
              type="submit"
              mt={4}
              variant="outline"
              backgroundColor="teal"
            >
              Change Password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};
ChangePassword.getInitialProps = ({ query }) => {
  return {
    token: query.token as string,
  };
};

export default withUrqlClient(createUrqlClient)(ChangePassword);
