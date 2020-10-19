import React from "react";

import { useSiteMetadata } from "gatsby-theme-rpsych-viz/src/hooks/useSiteMetaData";

export const BibTex = ({lastUpdated, version}) => {
  const date = new Date(lastUpdated);
  const year = date.getFullYear();
  return (
    <p>
      {`@software{magnussonCohend,
    author = {Kristoffer Magnusson},
    title = {Interpreting Cohen's d Effect Size: An Interactive Visualization},
    url = {https://rpsychologist.com/d3/cohend/},
    version = {${version}},
    date = {${year}},
  }`}
    </p>
  );
};

export const ApaReference = ({lastUpdated, version}) => {
  //const data = useSiteMetadata();
  const date = new Date(lastUpdated);
  const year = date.getFullYear();
  return (
    <p style={{ paddingLeft: "2em", textIndent: "-2em" }}>
      Magnusson, K. ({year}).{" "}
      <em>Interpreting Cohen's d effect size: An interactive visualization</em>{" "}
      (Version {version}) [Web App]. R Psychologist.
      https://rpsychologist.com/d3/cohend/
    </p>
  );
};
