import React from "react";
import { Typography } from "@material-ui/core";

const Intro = React.memo(() => {
  return (
    <div>
      <Typography variant="body1" paragraph>
      P-values are often misinterpreted or misused. My goal with this page is to explain p-values through an interactive simulation. (This is an early release that is still under development!).
      </Typography>
    </div>
  );
});

export default Intro;
