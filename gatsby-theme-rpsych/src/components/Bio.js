import React from "react";
import { useStaticQuery, graphql } from "gatsby";
import Image from "gatsby-image";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import MuiLink from "@material-ui/core/Link";
import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";

const Bio = () => {
  const data = useStaticQuery(bioQuery);
  const { author, social } = data.site.siteMetadata;
  const { t } = useTranslation("blog");
  return (
    <Grid container direction="row" alignItems="center" spacing={2}>
      <Grid item xs={3}>
        <Image
          fluid={data.avatar.childImageSharp.fluid}
          alt="Kristoffer Magnusson"
          style={{
            width: "100%",
            borderRadius: `100%`,
          }}
        />
      </Grid>
      <Grid item xs>
        <Typography variant="body2">
          <Trans t={t} i18nKey="authorBio">
            Written by <strong>Kristoffer Magnusson</strong>, a researcher in
            clinical psychology.{" "}
            <MuiLink href={`https://twitter.com/${social.twitter}`}>
              You should follow him on Twitter
            </MuiLink>{" "}
            and come hang out on the open science discord{" "}
            <MuiLink href="https://discord.gg/8DZmg2g">Git Gud Science</MuiLink>
            .
          </Trans>
        </Typography>
      </Grid>
    </Grid>
  );
};

const bioQuery = graphql`
  query {
    avatar: file(absolutePath: { regex: "/profile.jpg/" }) {
      childImageSharp {
        fluid(maxWidth: 150, maxHeight: 150, quality: 90) {
          ...GatsbyImageSharpFluid
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
`;

export default Bio;
