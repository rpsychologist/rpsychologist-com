import React from 'react'
import { graphql, navigate } from 'gatsby'
import Bio from '../components/Bio'
import Layout from '../components/Layout'
import SEO from '../components/seo'
import Hero from '../components/start/Hero'
import Container from '@material-ui/core/Container'
import Typography from '@material-ui/core/Typography'
import Pagination from '@material-ui/lab/Pagination'
import MoreViz from '../components/MoreViz'
import Powerlmm from '../components/start/Powerlmm'
import InternalLink from '../utils/InternalLink'
import { makeStyles } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  post: {
    '&:focus h3': {
      textDecoration: 'underline',
      color: theme.palette.primary.main,
    },
  },
  heading: {
    color: theme.palette.type === 'dark' ? '#fff' : '#000',

  },
  postTitle: {
    color: theme.palette.type === 'dark' ? '#fff' : '#000',
    fontWeight: 500,
    paddingBottom: '0.25em',
    '&:hover, &:focus': {
      textDecoration: 'underline',
      color: theme.palette.primary.main,
    },
  },
  postMeta: {
    color: theme.palette.type === 'dark' ? '#fff' : '#000',
    '&:hover': {
      textDecoration: 'none',
    },
  },
}))

const BlogIndex = props => {
  const { data, pageContext } = props
  const classes = useStyles()
  const handleBlogPaginate = (event, value) => {
    navigate(`/${value == 1 ? '' : value}#blog-posts`)
  }
  const siteTitle = data.site.siteMetadata.title
  const posts = data.allMdx.edges
  return (
    <Layout location={props.location} title={siteTitle}>
      <SEO
        title="Start"
        keywords={[
          'Kristoffer Magnusson',
          'R psychologist',
          'R',
          'Psychology',
          'Statistics',
          'Open science',
          'Psychotherapy',
          'PhD',
          'Research',
        ]}
      />
      <Hero />
      <Container maxWidth="sm">
        <InternalLink to="/posts">
          <Typography
            variant="h2"
            component="h2"
            align="center"
            id="blog-posts"
            className={classes.heading}
          >
            Blog Posts
          </Typography>
        </InternalLink>
        {posts.map(({ node }) => {
          const title = node.frontmatter.title || node.fields.slug
          return (
            <div key={node.fields.slug} style={{ paddingBottom: '2em'}}>
              <InternalLink to={node.fields.slug} underline='none' className={classes.post}>
                <Typography
                  variant="h5"
                  component="h3"
                  className={classes.postTitle}
                >
                  {title}
                </Typography>
                <div className={classes.postMeta}>
                <Typography
                  variant="subtitle2"
                  component="p"
                  color="textSecondary"
                  style={{ paddingBottom: '0.5em' }}
                >
                  {node.frontmatter.date}
                </Typography>
                <Typography
                  variant="body2"
                  component="p"
                  gutterBottom
                  dangerouslySetInnerHTML={{ __html: node.excerpt }}
                />
                </div>
              </InternalLink>
            </div>
          )
        })}
        <Pagination
          count={pageContext.numPages}
          page={pageContext.currentPage}
          onChange={handleBlogPaginate}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </Container>
      <Container maxWidth="sm" style={{ paddingTop: '2em' }}>
        <Typography variant="h2" component="h2" align="center">
          Projects
        </Typography>
        <InternalLink to="/viz">
          <Typography variant="h3" component="h3" align="center" className={classes.heading}>
            Interactive Visualizations
          </Typography>
        </InternalLink>
        <Typography component="p" style={{ paddingBottom: '1em' }}>
          Since 2014 I've created various interactive tools to teach statistics.
        </Typography>
      </Container>
      <Container maxWidth="md">
        <MoreViz />
      </Container>
      <Container maxWidth="sm">
        <Typography variant="h3" component="h3" align="center">
          R Software
        </Typography>
        <Powerlmm />
      </Container>
    </Layout>
  )
}

export default BlogIndex

export const pageQuery = graphql`
  query($skip: Int!, $limit: Int!) {
    site {
      siteMetadata {
        title
      }
    }
    allMdx(
      filter: { fileAbsolutePath: { regex: "/content/blog/" } }
      sort: { fields: [frontmatter___date], order: DESC }
      limit: $limit
      skip: $skip
    ) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            date(formatString: "YYYY-MM-DD")
            title
          }
        }
      }
    }
  }
`
