import React from 'react'
import { graphql } from 'gatsby'
import Image from 'gatsby-image'
import Layout from 'gatsby-theme-rpsych/src/components/Layout'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import Box from '@material-ui/core/Box'
import Typography from '@material-ui/core/Typography'
import MuiLink from '@material-ui/core/Link'
import TwitterIcon from '@material-ui/icons/Twitter'
import LinkedInIcon from '@material-ui/icons/LinkedIn'
import EmailIcon from '@material-ui/icons/Email'
import AlternateEmailIcon from '@material-ui/icons/AlternateEmail'
import SEO from 'gatsby-theme-rpsych/src/components/seo'

const Contact = props => {
  const { data } = props
  const { social } = data.site.siteMetadata

  return (
    <Layout>
      <SEO title="About Kristoffer" />
      <Container maxWidth="sm">
        <Typography variant="h1" component="h1" align="center">
          About
        </Typography>
      </Container>
      <Container maxWidth="md">
        <Grid container direction="row" justify="center" spacing={3}>
          <Grid item xs={6} sm={3}>
            <Image
              fluid={data.avatar.childImageSharp.fluid}
              alt="Kristoffer Magnusson"
            />
          </Grid>
          <Grid item sm>
            <Typography variant="body1" paragraph>
              I'm Kristoffer Magnusson a researcher in clinical psychology at
              the Centre for Psychiatry Research, Karolinska Institutet, in
              Stockholm, Sweden. My interests are a mix of open science,
              gambling problems, statistics, therapist effects, visualization,
              and psychotherapy.
            </Typography>
            <Typography variant="body1" paragraph>
              I also have a background in web development, and I still dabble
              with JavaScript and I have created various interactive
              visualziation of statistical concepts.
            </Typography>
            <Typography variant="body1" paragraph>
              You can find a list of my publications at{' '}
              <MuiLink href="https://scholar.google.com/citations?user=IK8wjnUAAAAJ">
                Google Scholar
              </MuiLink>{' '}
              or{' '}
              <MuiLink href="https://orcid.org/0000-0003-0713-0556">
                ORCID
              </MuiLink>
              .
            </Typography>
          </Grid>
        </Grid>

        <Grid container direction="row" spacing={3}>
          <Grid item xs>
            <Typography variant="body1" paragraph>
              You can read more about my thoughts on psychotherapy research in
              my PhD thesis:{' '}
              <MuiLink href="https://openarchive.ki.se/xmlui/handle/10616/46909">
                "Methodological issues in psychological treatment research"
              </MuiLink>
              .
            </Typography>
            <Box
              display={{ xs: 'block', sm: 'none' }}
              style={{ marginBottom: '2em' }}
            >
              <MuiLink href="https://openarchive.ki.se/xmlui/handle/10616/46909">
                <Image
                  fluid={data.thesis.childImageSharp.fluid}
                  alt="K Magnusson PhD Thesis Cover"
                  style={{
                    maxWidth: 200,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                />
              </MuiLink>
            </Box>

            <Typography variant="h4" gutterBottom>
              Contact
            </Typography>
            <Typography variant="body1" paragraph>
              You can get in contact with via
              hello <AlternateEmailIcon fontSize="inherit" /> rpsychologist.com
              or on <MuiLink href={`https://twitter.com/${social.twitter}`}>
                Twitter @{social.twitter}
              </MuiLink>
              , and feel free to add me on{' '}
              <MuiLink href={social.linkedin}>LinkedIn</MuiLink>.
            </Typography>
            <Typography variant="body1" paragraph>
              You can also come hang out and chat with me on the open science discord{' '}
              <MuiLink href="https://discord.gg/8DZmg2g">
                Git Gud Science
              </MuiLink>
              .
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Box
              display={{ xs: 'none', sm: 'block' }}
              style={{ marginBottom: '2em' }}
            >
              <MuiLink href="https://openarchive.ki.se/xmlui/handle/10616/46909">
                <Image
                  fluid={data.thesis.childImageSharp.fluid}
                  alt="K Magnusson PhD Thesis Cover"
                />
              </MuiLink>
            </Box>
          </Grid>
        </Grid>
      </Container>
      <Container maxWidth="sm"></Container>
    </Layout>
  )
}

export default Contact

export const bioQuery = graphql`
  query {
    avatar: file(absolutePath: { regex: "/profile.jpg/" }) {
      childImageSharp {
        fluid(maxWidth: 250, quality: 80) {
          ...GatsbyImageSharpFluid_withWebp
        }
      }
    }
    thesis: file(absolutePath: { regex: "/thesis_cover_front.png/" }) {
      childImageSharp {
        fluid(maxWidth: 250, quality: 80) {
          ...GatsbyImageSharpFluid_withWebp
        }
      }
    }
    site {
      siteMetadata {
        author
        social {
          twitter
          github
          linkedin
        }
      }
    }
  }
`
