import React from "react";
import { graphql } from "gatsby";
import App from "../App";

export default (props) => {
  return <App {...props} />;
};

export const pageQuery = graphql`
  query likelihood {
    FAQ: allMdx(
      filter: { fileAbsolutePath: { regex: "/likelihood/FAQ/" } }
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
    license: mdx(slug: { eq: "likelihood/license" }) {
      id
      body
      slug
    }
    image: file(absolutePath: { regex: "/likelihood_meta.png/" }) {
      childImageSharp {
        resize(width: 1200) {
          src
          height
          width
        }
      }
    }
  }
`;
