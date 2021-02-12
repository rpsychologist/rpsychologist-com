import React from "react";
import { graphql } from "gatsby";
import App from "../App";

export default (props) => {
  return <App {...props} />;
};

export const pageQuery = graphql`
  query cohend($locale: String!, $originalPath: String!, $permalinkRegEx: String) {
    FAQ: allMdx(
      filter: { fileAbsolutePath: { regex: "/cohend/FAQ/" }, fields: {locale: {eq: $locale }} }
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
    intro: mdx(fileAbsolutePath: { regex: "/cohend/intro/" }, fields: {locale: {eq: $locale }} 
    ) {
          id
          body
          frontmatter {
            title
          }
          slug
    }
    CL: mdx(fileAbsolutePath: { regex: "/cohend/common-language/" }, fields: {locale: {eq: $locale }} 
    ) {
          id
          body
          frontmatter {
            title
          }
          slug
    }
    allTranslations: availableTranslationsYaml(originalPath: {eq: $originalPath}) {
      langCode
    }
    image: file(absolutePath: { regex: "/cohend_SEO.png/" }) {
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
