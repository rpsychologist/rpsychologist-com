import React from "react";
import { Typography } from "@material-ui/core";

const Intro = () => {
  return (
    <div>
      <Typography variant="body1">
        <p>
          The maximum likelihood method is used to fit many models in
          statistics. In this post I will present some interactive
          visualizations to try to explain maximum likelihood estimation and
          some common hypotheses tests (the likelihood ratio test, Wald test,
          and Score test).
        </p>
        <p>
          We will use a simple model with only two unknown parameters: the mean
          and variance. Our primary focus will be on the mean and we'll treat
          the variance as a nuisance parameter.
        </p>
      </Typography>
    </div>
  );
};

export default Intro;
