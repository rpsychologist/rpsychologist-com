import React from "react";
import { Typography } from "@material-ui/core";

const License = ({ blogPost }) => {
  return blogPost ? (
      <>
      Except where otherwise noted, the content of this blog post is licensed
      under a{" "}
      <a href="https://creativecommons.org/licenses/by/4.0/">
        Creative Commons Attribution 4.0 International license
      </a>
      .
      </>
  ) : (
      <>
      Most content on this blog is licensed under a CC-BY or CC0 license, the
      specific license for each page will appear here.
      </>
  );
};
export default License;
