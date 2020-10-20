import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import CardThumbnail from './CardThumbnail'
const MoreViz = (props) => {
  const data = useStaticQuery(
    graphql`
      query MoreViz {
        allOtherVizYaml {
          edges {
            node {
              id
              image {
                childImageSharp {
                  fluid(maxWidth: 200) {
                    ...GatsbyImageSharpFluid
                  }
                }
              }
              title
              url
              excerpt
              internal_link
            }
          }
        }
      }
    `
  )
  return (
    <CardThumbnail data={data} {...props} />
  )
}

export default MoreViz
