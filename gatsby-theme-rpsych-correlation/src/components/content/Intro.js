import React from "react";
import { Typography } from "@material-ui/core";

const Intro = React.memo(() => {
  return (
    <div>
      <Typography variant="body1" paragraph>
        Correlation is one of the most widely used tools in statistics. The
        correlation coefficient summarizes the association between two
        variables. In this visualization I show a scatter plot of two variables
        with a given correlation. The variables are samples from the standard
        normal distribution, which are then transformed to have a given
        correlation by using Cholesky decomposition. By moving the slider you
        will see how the shape of the data changes as the association becomes
        stronger or weaker. You can also look at the Venn diagram to see the
        amount of shared variance between the variables. It is also possible
        drag the data points to see how the correlation is influenced by
        outliers.
      </Typography>
    </div>
  );
});

export default Intro;
