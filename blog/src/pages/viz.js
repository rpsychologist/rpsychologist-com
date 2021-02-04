import React from 'react'
import { graphql } from 'gatsby'
import Layout from 'gatsby-theme-rpsych/src/components/Layout'
import Container from '@material-ui/core/Container'
import MuiLink from '@material-ui/core/Link'
import Grid from "@material-ui/core/Grid";
import Typography from '@material-ui/core/Typography'
import SEO from 'gatsby-theme-rpsych/src/components/seo'
import MoreViz from 'gatsby-theme-rpsych/src/components/MoreViz'
import Posters from 'gatsby-theme-rpsych/src/components/Posters'
import SocialShare from 'gatsby-theme-rpsych/src/components/SocialShare'
import License from '../License'
import Webmentions from 'gatsby-theme-rpsych/src/components/Webmentions'
import BuyMeACoffee from 'gatsby-theme-rpsych-viz/src/components/BuyMeACoffee'

const Viz = ({ data, pageContext }) => {
  const image = data.image ? data.image.childImageSharp.resize : null

  return (
    <Layout data={data} license={<License/>}>
      <SEO
        title="Visualizations"
        description="An overview of Kristoffer Magnusson's interactive statistical visualizations. Free and open source teaching tools."
        image={image}
      />
      <Container maxWidth="sm">
        <Typography variant="h1" component="h1" align="center">
          Visualizations
        </Typography>
          <SocialShare
            slug="viz"
            title="Check out @krstoffr's interactive statistical visualizations"
          />
        <Typography variant="body1" paragraph>
          Since 2014 I've tried to illustrate various statistical concepts using
          interactive visualizations. This page contains an updated overview of
          my visualizations.
        </Typography>
      </Container>
      <Container maxWidth="md">
        <MoreViz explanation={true} />
      </Container>
      <Container maxWidth="sm">
        <Typography variant="h1" component="h1" align="center" id="posters">
          Posters
        </Typography>
        <Typography variant="body1" paragraph>
          I used to sell posters on{' '}
          <MuiLink href="https://www.etsy.com/shop/rpsychologist">Etsy</MuiLink>
          , but after making 95 sales (a magic number in science) I decided to
          stop and share the digital files here for free instead. You can print
          them in whatever way that fits you. If you want to support me just{' '}
          <MuiLink href="https://www.buymeacoffee.com/krstoffr">
            Buy Me a Coffee
          </MuiLink>{' '}
          or share this page, or print the posters using this affiliate link{' '}
          <MuiLink href="https://www.printful.com/custom/wall-art/posters/a/910832:f09e91e3e673c49a3a9ec6abf122f0de">
            Printful print-on-demand
          </MuiLink>{' '}
          (it's the company I used when I sold these posters).
          </Typography>
          <Typography variant="body2" paragraph>
           All posters below are licensed under a
          <MuiLink href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
            {' '}
            Creative Commons Attribution-NonCommercial-ShareAlike 4.0 (CC
            BY-NC-SA 4.0) license
          </MuiLink>
        </Typography>
      </Container>
      <Container maxWidth="md" style={{ paddingBottom: '2em' }}>
        <Posters explanation={true} />
      </Container>
      <Container maxWidth="sm" style={{ paddingBottom: '2em' }}>
      <Grid
        container
        spacing={2}
        direction="column"
        justify="center"
        alignItems="center"
      >
        <BuyMeACoffee />
        </Grid>
      </Container>
      <Container maxWidth="sm" style={{ paddingBottom: '2em' }}>
        <Webmentions edges={data.webmentions.edges}/>
      </Container>
    </Layout>
  )
}

export default Viz

export const imgQuery = graphql`
  query($permalinkRegEx: String) {
    image: file(absolutePath: { regex: "/viz-card.png/" }) {
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
`
