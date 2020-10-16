import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import CardThumbnail from './CardThumbnail'
const MoreViz = ({ explanation }) => {
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
            }
          }
        }
      }
    `
  )
  return (
    <CardThumbnail data={data} explanation={explanation} />
  )
}

export default MoreViz
