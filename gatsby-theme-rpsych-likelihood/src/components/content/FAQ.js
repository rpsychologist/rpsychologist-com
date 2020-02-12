import React from "react";
import { graphql, useStaticQuery } from "gatsby";
import { Typography, makeStyles } from "@material-ui/core";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    paddingBottom: "2em"
  },
  heading: {
    fontSize: theme.typography.pxToRem(20),
    fontWeight: theme.typography.fontWeightRegular
  },
  content: {
    minWidth: "100%"
  }
}));

const FaqPage = () => {
  const classes = useStyles();
  const data = useStaticQuery(
    graphql`
      query {
        allMarkdownRemark(
          filter: { fileAbsolutePath: { regex: "/FAQ/" } }
          sort: { fields: frontmatter___order, order: ASC }
        ) {
          edges {
            node {
              id
              html
              frontmatter {
                title
                order
              }
            }
          }
          totalCount
        }
      }
    `
  );

  return (
    <div className={classes.root}>
      {data.allMarkdownRemark.edges.map(({ node }) => (
        <ExpansionPanel>
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`FAQ-${node.frontmatter.id}`}
            id={`FAQ-${node.frontmatter.id}`}
          >
            <Typography className={classes.heading}>
              {node.frontmatter.title}
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails collapsedHeight="0px">
            <Typography variant="body1" className={classes.content}>
              <div dangerouslySetInnerHTML={{ __html: node.html }} />
            </Typography>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      ))}
    </div>
  );
};

export default FaqPage;
