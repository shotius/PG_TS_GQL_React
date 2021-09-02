import { Box, Button, Flex, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useMeQuery } from "../generated/graphql";

export const Navbar: React.FC = () => {
  const [{ data, fetching }] = useMeQuery();
  let body = null;

  // if loading
  if (fetching) {
    body = null;
    // not logged in
  } else if (!data?.me) {
    body = (
        <Box ml={"auto"}>
          <NextLink href="/login">
            <Link>login</Link>
          </NextLink>
          <NextLink href="/register">
            <Link ml={4}>regester</Link>
          </NextLink>
        </Box>
    );
    // logged in
  } else {
    body = (
      <Flex ml={"auto"}>
        <Box mr={4}>{data.me.username}</Box>
        <Button variant="link" color="white">logout</Button>
      </Flex>
    );
  }

  return (
    <Flex bg={"tomato"} p={4}>
      {body}
    </Flex>
  );
};
