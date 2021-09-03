import { withUrqlClient } from "next-urql";
import { Navbar } from "../components/Navbar";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  return (
    <div>
      <Navbar />
      <h1>Hello Next </h1>
    </div>
  );
};

export default withUrqlClient(createUrqlClient, {ssr: true})(Index);
