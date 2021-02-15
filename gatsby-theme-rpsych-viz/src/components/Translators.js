import React from "react";
import TwitterIcon from "@material-ui/icons/Twitter";
import Link from "@material-ui/core/Link";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(() => ({
    translatorTwitterButton: {
      margin: "-10px"
    }
  }));
const WithLinkIfHasUrl = ({ url, children }) => {
  return url ? (
    <Link href={url} target="_blank">
      {children}
    </Link>
  ) : (
    children
  );
};
const isMultipleButNotLast = (numTranslators, i) => numTranslators > 1 && i < numTranslators - 1
const Twitter = ({ twitter }) => {
  const classes = useStyles();

  return (
    twitter && (
      <span>
        {" "}
        <IconButton
          className={classes.translatorTwitterButton}
          href={`https://twitter.com/${twitter}`}
          target="_blank"
          rel="nofollow noopener"
          size="medium"
        >
          <TwitterIcon fontSize="inherit" />
        </IconButton>
      </span>
    )
  );
};

const Translators = ({ translator }) => {
  return translator.map((t, i) => {
    const numTranslators = translator.length;
    const { name, url, twitter } = t;
    let separator;
    if (isMultipleButNotLast(numTranslators, i)) {
      separator = " • "
    } 
    return (
      <span key={i}>
        <WithLinkIfHasUrl url={url}>{name}</WithLinkIfHasUrl>
        <Twitter twitter={twitter} />
        {separator}
      </span>
    );
  });
};

export default Translators;
