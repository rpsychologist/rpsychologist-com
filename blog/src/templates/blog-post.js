import React from 'react'
import { graphql } from 'gatsby'
import { MDXRenderer } from 'gatsby-plugin-mdx'
import Typography from '@material-ui/core/Typography'
import Divider from '@material-ui/core/Divider'
import { makeStyles } from '@material-ui/styles'
import Bio from 'gatsby-theme-rpsych/src/components/Bio'
import Layout from 'gatsby-theme-rpsych/src/components/Layout'
import SEO from 'gatsby-theme-rpsych/src/components/seo'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import ListSubheader from '@material-ui/core/ListSubheader'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import Collapse from '@material-ui/core/Collapse'
import Social from 'gatsby-theme-rpsych/src/components/Social'
import Tags from 'gatsby-theme-rpsych/src/components/TagsPost'
import Link from '@material-ui/core/Link'
import InternalLink from 'gatsby-theme-rpsych/src/utils/InternalLink'
import { withStyles } from '@material-ui/core/styles'
import TableContainer from '@material-ui/core/TableContainer'

const StyledTableContainer = withStyles(() => ({
  root: {
    boxShadow: 'none',
    marginBottom: '2em',
  },
}))(TableContainer)

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    [theme.breakpoints.up('md')]: {
      paddingLeft: 230,
    },
    [theme.breakpoints.up('lg')]: {
      paddingLeft: 300,
    },
  },
  content: {
    [theme.breakpoints.up('lg')]: {
      marginLeft: 0,
    },
    [`@media (min-width: 1700px)`]: {
      marginLeft: -300,
    },
  },

  article: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 960,
    lineHeight: '1.82813rem !important',
    marginBottom: '1.82813rem',
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    '& .gatsby-resp-image-figure': {
      marginTop: '3.25rem',
      marginBottom: '3.25rem',
    },
    '& .gatsby-resp-image-wrapper': {
      marginTop: '3.25rem',
      marginBottom: '3.25rem',
    },
    '& figure > .gatsby-resp-image-wrapper': {
      marginTop: '0',
      marginBottom: '0',
    },
    '& .anchor.before': {
      position: 'absolute',
      top: 0,
      left: 0,
      transform: 'translateX(-100%)',
      paddingRight: ' 4px',
    },
    '& img': {
      maxWidth: '100%',
    },
    '& .article--outer': {
      maxWidth: '650px',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  articleInner: {
    maxWidth: 650,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  tocRoot: {
    width: '100%',
    height: 'calc(100vh)',
    backgroundColor: theme.palette.background.paper,
  },
  tableOfContents: {
    top: 65,
    // Fix IE 11 position sticky issue.
    width: 230,
    flexShrink: 0,
    position: 'fixed',
    overflowY: 'auto',
    padding: theme.spacing(0, 0, 0, 0),
    display: 'none',
    [theme.breakpoints.up('md')]: {
      display: 'block',
    },
    '& *': {
      fontSize: '14px',
    },
    [theme.breakpoints.up('lg')]: {
      width: 300,
      '& *': {
        fontSize: '16px',
      },
    },
    '& ul': {
      margin: 0,
      padding: 5,
      listStyle: 'none',
    },
  },
  itemOpen: {
    color: 'gray',
    fontWeight: 600,
  },
  nested: {
    paddingLeft: theme.spacing(2),
  },
  item: {
    boxSizing: 'content-box',
    color: 'gray',
    borderLeft: '4px solid transparent',
    textDecoration: 'none',
    '&:hover': {
      borderLeft: '4px solid',
    },
  },
}))

const ListItemLink = props => {
  return <ListItem disableRipple button component="a" {...props} />
}

const createTocLevel = (i, nested) => {
  const classes = useStyles()
  const [open, setOpen] = React.useState(false)

  const handleClick = () => {
    setOpen(!open)
  }
  if (!i.items) {
    return (
      <ListItemLink href={i.url} key={i.url}>
        <ListItemText primary={i.title} />
      </ListItemLink>
    )
  } else {
    return (
      <React.Fragment key={i.url}>
        <ListItemLink button onClick={handleClick}>
          <ListItemText primary={i.title} />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItemLink>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List dense component="div" disablePadding className={classes.nested}>
            <ListItemLink href={i.url}>
              <ListItemText primary="Intro" />
            </ListItemLink>
            {i.items.map(i => createTocLevel(i, true))}
          </List>
        </Collapse>
      </React.Fragment>
    )
  }
}

const Toc = ({ post }) => {
  const classes = useStyles()
  return (
    <nav className={classes.tableOfContents}>
      <List
        component="nav"
        aria-labelledby="nested-list-subheader"
        dense
        subheader={
          <ListSubheader component="div" id="nested-list-subheader">
            Contents
          </ListSubheader>
        }
        className={classes.tocRoot}
      >
        {post.tableOfContents.items.map(i => createTocLevel(i))}
      </List>
    </nav>
  )
}

const BlogPostTemplate = ({ data, pageContext, location }) => {

  const classes = useStyles()
  const post = data.mdx
  const siteTitle = data.site.siteMetadata.title
  const { previous, next } = pageContext
  return (
    <Layout location={location} title={siteTitle} data={data}>
      {post.frontmatter.include_toc && <Toc post={post} />}
      <SEO title={post.frontmatter.title} description={post.excerpt} />
      <div className={post.frontmatter.include_toc && classes.root}>
        <div className={post.frontmatter.include_toc && classes.content}>
          <Container maxWidth="md">
            <Typography
              variant="h1"
              align="center"
              style={{ fontWeight: 700, marginBottom: '2.5rem' }}
            >
              {post.frontmatter.title}
            </Typography>
          </Container>
          <Container className={classes.article}>
            <Grid
              container
              direction="row"
              alignItems="center"
              justify="space-between"
              style={{ maxWidth: 650, margin: 'auto' }}
            >
              <Grid item>
                <Typography variant="subtitle2" component="span">
                  {post.frontmatter.date}
                </Typography>
              </Grid>
              <Grid item>
                <Social
                  slug={post.frontmatter.slug}
                  title={post.frontmatter.title}
                />
              </Grid>
            </Grid>
            <MDXRenderer>{post.body}</MDXRenderer>
            <div className={classes.articleInner}>
              <Divider style={{ marginBottom: '1em', marginTop: '1em' }} />
              <Bio />
              <Divider style={{ marginTop: '1em', marginBottom: '1em' }} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                <Typography
                  variant="subtitle2"
                  component="span"
                  color="textSecondary"
                >
                  Share:
                </Typography>
                <Social
                  slug={post.frontmatter.slug}
                  title={post.frontmatter.title}
                />
              </div>
              <Tags tags={post.frontmatter.tags} />
              <Typography
                paragraph
                variant="subtitle2"
                style={{ marginTop: '1em' }}
              >
                Published {post.frontmatter.date}{' '}
                <Link
                  href={`https://github.com/rpsychologist/rpsychologist-com/blog/blob/master/content/blog/${post.parent.relativePath}`}
                >
                  (View on GitHub)
                </Link>
              </Typography>

              <Divider style={{ marginBottom: '1em' }} />

              <ul
                style={{
                  display: `flex`,
                  flexWrap: `wrap`,
                  justifyContent: `space-between`,
                  listStyle: `none`,
                  padding: 0,
                }}
              >
                <li>
                  {previous && (
                    <InternalLink to={previous.fields.slug} rel="prev">
                      ← {previous.frontmatter.title}
                    </InternalLink>
                  )}
                </li>
                <li>
                  {next && (
                    <InternalLink to={next.fields.slug} rel="next">
                      {next.frontmatter.title} →
                    </InternalLink>
                  )}
                </li>
              </ul>
            </div>
          </Container>
        </div>
      </div>
    </Layout>
  )
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query($slug: String!) {
    site {
      siteMetadata {
        title
        author
      }
    }
    mdx(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      tableOfContents
      frontmatter {
        title
        include_toc
        slug
        tags
        date(formatString: "MMMM DD, YYYY")
      }
      body
      parent {
        ... on File {
          relativePath
        }
      }
    }
    license: mdx(
      fileAbsolutePath: { regex: "/blog/content/license/license-post/" }
    ) {
      id
      body
      slug
    }
  }
`
