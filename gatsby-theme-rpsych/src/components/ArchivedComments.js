import React, { useState, useLayoutEffect, createRef } from "react";
import { graphql } from "gatsby";
import clsx from "clsx";
import Avatar from "@material-ui/core/Avatar";
import MuiLink from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import ReplyIcon from "@material-ui/icons/Reply";
import LinkIcon from "@material-ui/icons/Link";
import { makeStyles } from "@material-ui/core/styles";
import TwitterIcon from "@material-ui/icons/Twitter";
const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    padding: "1em",
  },
  truncatedArea: {
    overflow: "hidden",
    maxHeight: "500px",
    maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
  },
  expandedArea: {
    maxHeight: "100%",
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
    minWidth: "0",
  },
  commentAndReplies: {
    width: '100%',
    minWidth: '0',
    "& * > pre": {
      overflowX: 'scroll',
    },
  },
  reply: {
    width: "100%",
  },
  showMoreButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "-3em",
    marginBottom: "3em",
  },
  showMoreButtonExpanded: {
    marginTop: "0em",
  },
}));

const readablePublishDate = (published) => {
  let postDate = new Date(published);
  postDate = postDate.toLocaleDateString("sv-SE");

  return postDate;
};

const getRepliesToComment = (comment, replies, results) => {
  results = results || [];
  const repliesFiltered = replies.filter((d) => d.parentId === comment.id);
  if (repliesFiltered.length > 0) {
    results.push(repliesFiltered[0]);
    // recurse to check if there's any replies to the reply
    repliesFiltered.map((r) => getRepliesToComment(r, replies, results));
  }
  return results;
};

const CommentCard = ({ comment, replies }) => {
  const classes = useStyles();
  const x = getRepliesToComment(comment, replies);
  return (
    <div className={classes.root}>
      <div className={classes.icon}>
        <Avatar alt={comment.author.name}>
          {comment.author.name.charAt(0).toUpperCase()}
        </Avatar>
      </div>
      <div className={classes.commentAndReplies}>
        <div className={classes.comment}>
          <div>
            <Typography
              component="span"
              color="primary"
              style={{ fontWeight: 500 }}
            >
              {comment.author.name}
            </Typography>{" "}
            <Typography variant="caption" style={{ whiteSpace: "nowrap" }}>
              {" "}
              {readablePublishDate(comment.createdAt)}
            </Typography>
          </div>
          <div dangerouslySetInnerHTML={{ __html: comment.message }} />
        </div>
        {x.map((r, i) => (
          <div style={{ paddingLeft: "0em" }} key={i}>
            <Typography
              component="span"
              color="primary"
              style={{ fontWeight: 500 }}
            >
              <ReplyIcon style={{ marginBottom: '-5px', transform: 'rotate(90deg) scaleY(-1)' }} />
              {r.author.name}
            </Typography>
            <Typography variant="caption" style={{ whiteSpace: "nowrap" }}>
              {" "}
              {readablePublishDate(r.createdAt)}
            </Typography>
            <div className={classes.reply} dangerouslySetInnerHTML={{ __html: r.message }} />
          </div>
        ))}
      </div>
    </div>
  );
};

const ArchivedComments = ({ comments }) => {
  const classes = useStyles();
  const [showAllComments, setShowAllComments] = useState(false);
  const [showMore, setShowMore] = useState(true);
  const ref = createRef();
  const replies = comments.filter((c) => c.parentId != "");
  const commentsFiltered = comments.filter((c) => c.parentId == "");
  useLayoutEffect(() => {
    if (ref.current.scrollHeight < 500) {
      setShowMore(false);
      setShowAllComments(true);
    }
  }, [ref]);
  return (
    <div className={classes.webmentions}>
      <Typography variant="h3" component="h2" align="center" gutterBottom>
        Archived Comments ({comments.length})
      </Typography>
      <div
        ref={ref}
        className={clsx({
          [classes.truncatedArea]: showAllComments === false,
          [classes.expandedArea]: showAllComments === true,
        })}
      >
        {commentsFiltered.map((comment, i) => (
          <CommentCard comment={comment} replies={replies} key={i} />
        ))}
      </div>
      <div
        className={clsx({
          [classes.showMoreButton]: true,
          [classes.showMoreButtonExpanded]: showAllComments === true,
        })}
        id="test"
      >
        {showMore && (
          <Button
            onClick={() => setShowAllComments(!showAllComments)}
            variant="contained"
            color="primary"
          >
            {showAllComments ? "Hide" : "Show all"}
          </Button>
        )}
      </div>
    </div>
  );
};
export default ArchivedComments;
