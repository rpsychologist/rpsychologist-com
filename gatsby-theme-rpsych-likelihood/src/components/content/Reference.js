import React from "react";
import CodeBlock from "gatsby-theme-rpsych/src/components/code/code-block";
import { useSiteMetadata } from "gatsby-theme-rpsych-viz/src/hooks/useSiteMetaData";

export const BibTex = ({ lastUpdated, version }) => {
  const date = new Date(lastUpdated);
  const year = date.getFullYear();
  return (
    <CodeBlock>
      <code className="BibTex">
        {`@software{magnussonCohend,
    author = {Kristoffer Magnusson},
    title = {Understanding Maximum Likelihood: An Interactive Visualization},
    url = {https://rpsychologist.com/likelihood/},
    version = {${version}},
    date = {${year}},
  }`}
      </code>
    </CodeBlock>
  );
};

export const ApaReference = ({lastUpdated, version}) => {
  //const data = useSiteMetadata();
  const date = new Date(lastUpdated);
  const year = date.getFullYear();
  return (
    <p style={{ paddingLeft: "2em", textIndent: "-2em" }}>
      Magnusson, K. ({year}).{" "}
      <em>Understanding Maximum Likelihood: An Interactive Visualization</em>{" "}
      (Version {version}) [Web App]. R Psychologist.
      https://rpsychologist.com/likelihood/
    </p>
  );
};
