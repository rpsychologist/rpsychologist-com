import React from "react";
import { graphql } from "gatsby";
import App from "../App";

export default (props) => {
  return <App {...props} />;
};

export const pageQuery = graphql`
  query correlation($permalinkRegEx: String) {
    FAQ: allMdx(
      filter: { fileAbsolutePath: { regex: "/correlation/FAQ/" } }
      sort: { fields: frontmatter___order, order: ASC }
    ) {
      edges {
        node {
          id
          body
          frontmatter {
            title
            order
          }
          slug
        }
      }
      totalCount
    }
    image: file(absolutePath: { regex: "/correlation_SEO.png/" }) {
      childImageSharp {
        resize(width: 1200) {
          src
          height
          width
        }
      }
    }
    ...webmentionQuery
  }
`;
