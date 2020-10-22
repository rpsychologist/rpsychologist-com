import React from 'react'
import { graphql } from 'gatsby'
import Typography from '@material-ui/core/Typography'
import Layout from '../components/Layout'
import SEO from '../components/seo'

const NotFoundPage = props => {
  return (
    <Layout location={props.location} data={props.data}>
      <SEO title="404: Not Found" />
      <Typography variant="h1" align="center">
        Not Found
      </Typography>
      <Typography variant="body1" paragraph align="center">
        You just hit a route that may or may not exist.
      </Typography>
    </Layout>
  )
}

export default NotFoundPage
export const pageQuery = graphql`
  query{
    license: mdx( fileAbsolutePath: { regex: "/assets/license/license/" }) {
      id
      body
      slug
    }
  }
`