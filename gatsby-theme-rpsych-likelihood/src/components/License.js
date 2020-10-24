import React from "react";
import { Typography } from "@material-ui/core";
import { version, lastUpdated } from "gatsby-theme-rpsych-likelihood/package.json"
import Link from '@material-ui/core/Link'

const License = () => {
  return (
    <div>
         Version {version}, last updated{" "}
              {lastUpdated}. License MIT (
              <Link href={"https://github.com/rpsychologist/rpsychologist-com/"}>source code</Link>).
              Visualization is CC0. 
    </div>
  )
};
export default License;
