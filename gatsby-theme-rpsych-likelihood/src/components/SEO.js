import React from "react";
import { Helmet } from "react-helmet";
import PropTypes from "prop-types";
import { StaticQuery, graphql } from "gatsby";

function SEO({ description, lang, meta, keywords }) {
  return (
    <StaticQuery
      query={detailsQuery}
      render={data => {
        const metaDescription =
          description || data.site.siteMetadata.description;
        const url = data.site.siteMetadata.url;
        const image = `https://rpsychologist.com/${data.image.seo.fluid.src.substr(1)}`;
        return (
          <Helmet
            htmlAttributes={{
              lang
            }}
            title={`${data.site.siteMetadata.title} | R Psychologist`}
            //titleTemplate={`%s | ${data.site.siteMetadata.title}`}
            meta={[
              {
                name: `description`,
                content: metaDescription
              },
              {
                property: `og:title`,
                content: data.site.siteMetadata.title
              },
              {
                property: `og:url`,
                content: url
              },
              {
                property: `og:description`,
                content: metaDescription
              },
              {
                property: `og:type`,
                content: `website`
              },
              {
                property: `fb:app_id`,
                content: `667756492`
              },
              {
                property: `og:image`,
                content: image
              },
              {
                name: `twitter:card`,
                content: `summary_large_image`
              },
              {
                name: `twitter:creator`,
                content: data.site.siteMetadata.twitter
              },
              {
                name: `twitter:title`,
                content: data.site.siteMetadata.title
              },
              {
                property: `twitter:image`,
                content: image
              },
              {
                name: `twitter:description`,
                content: metaDescription
              }
            ]
              .concat(
                keywords.length > 0
                  ? {
                      name: `keywords`,
                      content: keywords.join(`, `)
                    }
                  : []
              )
              .concat(meta)}
          />
        );
      }}
    />
  );
}

SEO.defaultProps = {
  lang: `en`,
  meta: [],
  keywords: []
};

SEO.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  meta: PropTypes.array,
  keywords: PropTypes.arrayOf(PropTypes.string),
};

export default SEO;

const detailsQuery = graphql`
  query SEOQuery {
    site {
      siteMetadata {
        title
        description
        author
        url
        twitter
      }
    }
    image: file(relativePath: { eq: "likelihood_meta.png" }) {
      seo: childImageSharp {
        fluid(maxWidth: 1400) {
          src
        }
      }
    }
  }
`;
