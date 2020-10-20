import React from "react";
import { Typography } from "@material-ui/core";
import { version, lastUpdated } from "../../package.json"

const License = ({ blogPost }) => {
  return (
    <>
         Version {version}, last updated{" "}
              {lastUpdated}. License MIT (
              <a href={"https://github/rpsychologist/rpsychologist-com/"}>source code</a>).
              Visualization is CC0. 
    </>
  )
};
export default License;
