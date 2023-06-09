import React from "react";
import { graphql } from "gatsby";
import App from "../App";
import { Location, globalHistory } from "@reach/router";
import { QueryParamProvider } from "use-query-params";

export default (props) => {
  return (
    <Location>
    {({ location }) => (
      <QueryParamProvider location={location} reachHistory={globalHistory}>
     <App {...props} />
    </QueryParamProvider>
      )}
    </Location>
  )

};

export const pageQuery = graphql`
  query therapistEffects($permalinkRegEx: String) {
    FAQ: allMdx(
      filter: { fileAbsolutePath: { regex: "/therapist-effects/FAQ/" } }
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
    intro: mdx(fileAbsolutePath: { regex: "/therapist-effects/intro/" }) {
          id
          body
          frontmatter {
            title
          }
          slug
    }
    CL: mdx(fileAbsolutePath: { regex: "/therapist-effects/common-language/" }) {
          id
          body
          frontmatter {
            title
          }
          slug
    }
    image: file(absolutePath: { regex: "/therapist-effects_SEO.png/" }) {
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
