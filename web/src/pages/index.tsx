import { Box, Heading } from "@chakra-ui/layout";
import { withUrqlClient } from "next-urql";
import React from "react";
import { Navbar } from "../components/Navbar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  const [{ data }] = usePostsQuery();
  return (
    <div>
      <Navbar />
      <h1>Hello Next </h1>
      <Heading as="h2"> Posts</Heading>
      <Box ml={4}>
        {!data ? (
          <div>..loading</div>
        ) : (
          data.posts.map((p) => <li key={p.id}>{p.title}</li>)
        )}
      </Box>
    </div>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
