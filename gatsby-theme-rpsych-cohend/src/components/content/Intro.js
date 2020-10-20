import React from "react";
import { Typography } from "@material-ui/core";

const Intro = React.memo(() => {
  return (
    <div>
      <Typography variant="body1" paragraph={true}>
          The Cohen's <em>d</em> effect size is immensely popular in psychology.
          However, its interpretation is not straightforward and researchers 
          often use general guidelines, such as small (0.2), medium (0.5) and
          large (0.8) when interpreting an effect. Moreover, in many cases it is
          questionable whether the standardized mean difference is more
          interpretable then the unstandardized mean difference.
        </Typography>
        <Typography variant="body1" paragraph={true}>
          In order to aid the interpretation of Cohen’s <em>d</em>, this
          visualization offers these different representations of Cohen's <em>d</em>:
          visual overlap, Cohen’s U<sub>3</sub>, the probability of superiority,
          percentage of overlap, and the number needed to treat. It also lets you
          change the standard deviation and displays the unstandardized difference.
          </Typography>
  
    </div>
  );
});

export default Intro;
