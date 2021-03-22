import React from "react";
import { graphql } from "gatsby";
import Avatar from "@material-ui/core/Avatar";
import MuiLink from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import LinkIcon from "@material-ui/icons/Link";
import { makeStyles } from "@material-ui/core/styles";
import TwitterIcon from "@material-ui/icons/Twitter";
import RepeatIcon from "@material-ui/icons/Repeat";
import FavoriteIcon from "@material-ui/icons/Favorite";
import { useTranslation } from "react-i18next";


const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    padding: "1em",
  },
  webmentions: {
    marginBottom: "1em",
  },
  icon: {
    paddingLeft: "1em",
    paddingRight: "1em",
    minWidth: "75px",
  },
  comment: {
    padding: "0em",
  },
  likesAndRetweetsOuter: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    paddingLeft: "2em",
  },
  likesAndRetweetsText: {
    display: "flex",
    color: "#6e767d",
    "& svg": {
      marginRight: "5px",
    },
    "&:not(:first-child)": {
      paddingLeft: "1em",
    },
  },
}));

const readablePublishDate = (published) => {
  let postDate = new Date(published);
  postDate = postDate.toLocaleDateString("sv-SE");

  return postDate;
};

const TweetCard = ({ node }) => {
  const classes = useStyles();

  return (
    <>
      <div className={classes.icon}>
        <MuiLink href={node.url} rel="nofollow noopener">
          <Avatar alt={node.author.name} src={node.author.photo} />
        </MuiLink>
      </div>
      <div className={classes.comment}>
        <div>
          <MuiLink href={node.url} rel="nofollow noopener">
            {node.author.name}
          </MuiLink>{" "}
          <TwitterIcon fontSize="inherit" color="primary" />
          <Typography variant="caption">
            {" "}
            {readablePublishDate(node.published)}
          </Typography>
        </div>
        <div>{node.content !== null && node.content.text}</div>
      </div>
    </>
  );
};

const WebCard = ({ node, domain }) => {
  const classes = useStyles();
  return (
    <>
      <div className={classes.icon}>
        <MuiLink href={node.url}>
          <Avatar alt={node.author.name} src={node.author.photo}>
            <LinkIcon />
          </Avatar>
        </MuiLink>
      </div>
      <div className={classes.comment}>
        <MuiLink href={node.url} rel="nofollow noopener">
          {domain}
        </MuiLink>
        <Typography variant="body2">
          {node.content !== null && node.content.text.substring(0, 100) + "..."}
        </Typography>
      </div>
    </>
  );
};

const Webmentions = ({ data }) => {
  const classes = useStyles();
  const { comments, numLikes, numRetweets } = data
  const { t } = useTranslation("blog")
  return (
    <div className={classes.webmentions}>
      <Typography variant="h3" component="h2" align="center" gutterBottom>
        Webmentions
      </Typography>
      <Grid
        container
        direction="row"
        justify="space-between"
        alignItems="center"
      >
        <Typography className={classes.likesAndRetweetsOuter} variant='body2' align="center">
          <span className={classes.likesAndRetweetsText}>
            <FavoriteIcon fontSize="small" />
            {numLikes.totalCount}{" "}
          </span>
          <span className={classes.likesAndRetweetsText}>
            <RepeatIcon fontSize="small" /> {numRetweets.totalCount}
          </span>
        </Typography>
        <Typography variant="div" variant="body2">
          <MuiLink href="https://indieweb.org/Webmention">{t("What's this?")}</MuiLink>
        </Typography>
      </Grid>

      {comments.edges.length > 0 ? (
        comments.edges.map(({ node }, i) => {
          const isTweet = node.url.includes("https://twitter.com");
          const domain = new URL(node.url).origin;
          return (
            <div className={classes.root} key={i}>
              {isTweet ? (
                <TweetCard node={node} />
              ) : (
                <WebCard node={node} domain={domain} />
              )}
            </div>
          );
        })
      ) : (
        <Typography align="center" component="p" variant="body1" gutterBottom>
          {t("There are no webmentions for this page")}
        </Typography>
      )}
      <Typography align="center" component="p" variant="caption">
        {t("Webmentions sent before 2021")}
      </Typography>
    </div>
  );
};
export default Webmentions;

export const query = graphql`
  fragment webmentionQuery on Query {
    comments: allWebMentionEntry(
      filter: {
        wmTarget: { regex: $permalinkRegEx } 
        wmSource: {regex: "/^https:\/\/brid\\.gy\/"}, 
        wmProperty: {in: ["mention-of", "in-reply-to"]}
      }) {
      edges {
        node {
          id
          wmTarget
          wmSource
          wmProperty
          wmId
          author {
            name
            photo
            type
            url
          }
          url
          content {
            text
          }
          published
        }
      }
    }
    numLikes: allWebMentionEntry(
      filter: {
        wmProperty: { eq: "like-of" }
          wmTarget: { regex: $permalinkRegEx } 
          wmSource: { regex: "/^https:\/\/brid\\.gy\/" },       
      }
      ) {
      totalCount
    }
    numRetweets: allWebMentionEntry(
      filter: {
        wmProperty: { eq: "repost-of" }
          wmTarget: { regex: $permalinkRegEx } 
          wmSource: { regex: "/^https:\/\/brid\\.gy\/" },       
      }
      ) {
      totalCount
    }
  }
`;
