import React from 'react'
import { graphql } from 'gatsby'
import InternalLink from 'gatsby-theme-rpsych/src/utils/InternalLink'
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
import License from '../License'

const Contact = props => {
  const { data } = props
  const { social } = data.site.siteMetadata

  return (
    <Layout data={data} license={<License />}>
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
              the <MuiLink href="https://ki.se/en/cns/centre-for-psychiatry-research">Centre for Psychiatry Research, Karolinska Institutet</MuiLink>, in
              Stockholm, Sweden and a research associate at <MuiLink href="https://www.oii.ox.ac.uk/people/profiles/kristoffer-magnusson/">the Oxford Internet Institute</MuiLink>. My interests are a mix of open science,
              gaming and gambling problems, statistics, therapist effects, visualization,
              and psychotherapy.
            </Typography>
            <Typography variant="body1" paragraph>
              I also have a background in web development, and I still work part as a web developer (mostly React/NextJS/Node). I have created various <InternalLink to="/viz">interactive
              visualizations of statistical concepts.</InternalLink>
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
              Questions
            </Typography>
            <Typography variant="body1" paragraph>
              Please use{' '}
              <MuiLink href="https://github.com/rpsychologist/rpsychologist-com/discussions">
                GitHub Discussions{' '}
              </MuiLink>
              for any questions related to this site, or{' '}
              <MuiLink href="https://github.com/rpsychologist/rpsychologist-com/issues">
                open an issue on GitHub
              </MuiLink>{' '}
              if you've found a bug or wan't to make a feature request.
            </Typography>
            <Typography variant="h4" gutterBottom>
              Contact
            </Typography>
            <Typography variant="body1" paragraph>
              You can get in contact with via hello{' '}
              <AlternateEmailIcon fontSize="inherit" /> rpsychologist.com or on{' '}
              <MuiLink href={`https://twitter.com/${social.twitter}`}>
                Twitter @{social.twitter}
              </MuiLink>
              , and feel free to add me on{' '}
              <MuiLink href={social.linkedin}>LinkedIn</MuiLink>.
            </Typography>
            <Typography variant="body1" paragraph>
              You can also come hang out and chat with me on the open science
              discord{' '}
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
