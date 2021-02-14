import React from "react";
import Avatar from "@material-ui/core/Avatar";
import Chip from "@material-ui/core/Chip";
import HomeRoundedIcon from "@material-ui/icons/HomeRounded";
import Link from "@material-ui/core/Link";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { useStaticQuery, graphql } from "gatsby";
import { useTranslation, Trans } from "react-i18next";
import Grid from "@material-ui/core/Grid";

const useStyles = makeStyles((theme) => ({
  sponsors: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    "& > *": {
      margin: theme.spacing(0.5),
    },
  },
}));

const GitHubSponsors = React.memo(() => {
  const classes = useStyles();
  const data = useStaticQuery(gitHubQuery);
  const { t } = useTranslation("blog");
  const gitHubSponsors = data.allGithubData
    ? data.allGithubData.nodes[0].data.user.sponsorshipsAsMaintainer.nodes
    : [];

  return (
    <div>
      <div>
        <Typography variant="body1" paragraph>
          <Trans i18nKey="GitHubSponsors" t={t}>
            You can sponsor my open source work using{" "}
            <Link href="https://github.com/sponsors/rpsychologist">
              GitHub Sponsors
            </Link>{" "}
            and have your name shown here.
          </Trans>
        </Typography>
      </div>
      <Typography variant="body2" paragraph align="center">
        {t("Backers")} ✨❤️
      </Typography>
      <Grid className={classes.sponsors}>
        {gitHubSponsors.map(({ tier, sponsor }) => {
          const name = sponsor.name ? sponsor.name : sponsor.login;
          return (
            <Chip
              label={name}
              avatar={<Avatar alt={name} src={sponsor.avatarUrl} />}
              color="primary"
              icon={<HomeRoundedIcon fontSize="small" color="primary" />}
              clickable
              component={Link}
              href={sponsor.url}
            />
          );
        })}
        <Chip
          label={t("Your Name")}
          color="default"
          icon={<HomeRoundedIcon fontSize="small" color="primary" />}
          clickable
          component={Link}
          href="https://github.com/sponsors/rpsychologist"
        />
      </Grid>
    </div>
  );
});
export default GitHubSponsors;

const gitHubQuery = graphql`
  {
    allGithubData {
      nodes {
        id
        data {
          user {
            sponsorshipsAsMaintainer {
              nodes {
                tier {
                  monthlyPriceInDollars
                  createdAt
                }
                sponsor {
                  name
                  avatarUrl
                  url
                  login
                }
              }
            }
          }
        }
      }
    }
  }
`;
