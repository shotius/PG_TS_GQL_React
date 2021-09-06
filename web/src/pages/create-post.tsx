import { Button } from "@chakra-ui/button";
import { FormLabel } from "@chakra-ui/form-control";
import { Box } from "@chakra-ui/layout";
import { Textarea } from "@chakra-ui/textarea";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/dist/client/router";
import React, { useState } from "react";
import { InputField } from "src/components/InputField";
import { Layout } from "src/components/Layout";
import { Wrapper } from "src/components/Wrapper";
import { useCreatePostMutation } from "src/generated/graphql";
import { createUrqlClient } from "src/utils/createUrqlClient";

const CreatePost: React.FC = ({}) => {
  const router = useRouter();
  const [, createPost] = useCreatePostMutation();

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: "", text: "" }}
        onSubmit={async (values) => {
          const { error } = await createPost({ options: values });
          if (!error) {
            router.push("/");
          }
        }}
      >
        {() => (
          <Form>
            <InputField name="title" label="Title" placeholder="title..." />
            <Box mt={4}>
              <FormLabel htmlFor="text">Text</FormLabel>
              <Textarea name="text" label="Text" placeholder="text..." />
            </Box>
            <Button
              variant="outline"
              type="submit"
              backgroundColor="teal"
              mt={2}
            >
              Create a Post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(CreatePost);
