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
  query pvalue($permalinkRegEx: String) {
    FAQ: allMdx(
      filter: { fileAbsolutePath: { regex: "/pvalue/FAQ/" } }
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
    image: file(absolutePath: { regex: "/pvalue_SEO.png/" }) {
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
