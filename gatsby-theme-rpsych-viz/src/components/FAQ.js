import React from "react";
import { graphql, useStaticQuery } from "gatsby";
import { MDXRenderer } from "gatsby-plugin-mdx";
import { Typography, makeStyles } from "@material-ui/core";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    paddingBottom: "2em",
    "& .gatsby-highlight": {
      borderRadius: 0,
      margin: "0 -16px 0 -16px",
      padding: "0 1em",
      overflow: "auto",
      backgroundColor: theme.palette.type === "light" ? "#fdf6e3" : "#151618",
    },
    '& :not(pre) > code[class*="language-"], pre[class*="language-"]': {
      backgroundColor: theme.palette.type === "light" ? "#fdf6e3" : "#151618",
    },
  },
  heading: {
    fontSize: theme.typography.pxToRem(20),
    fontWeight: theme.typography.fontWeightRegular,
  },
  content: {
    minWidth: "100%",
  },
  expanded: {
    "&$expanded": {
      backgroundColor: theme.palette.type === "light" ? "none" : "#1e1d1d",
    },
  },
}));

const FaqPage = React.memo(({data}) => {
  console.log(data)
  const classes = useStyles();
  // const data = useStaticQuery(
  //   graphql`
  //     query FAQ {
  //       allMdx(
  //         filter: { fileAbsolutePath: { regex: "/FAQ/" } }
  //         sort: { fields: frontmatter___order, order: ASC }
  //       ) {
  //         edges {
  //           node {
  //             id
  //             body
  //             frontmatter {
  //               title
  //               order
  //             }
  //           }
  //         }
  //         totalCount
  //       }
  //     }
  //   `
  // );

  return (
    <div className={classes.root}>
      <Typography variant="h4" component="h2" align="center" gutterBottom>
        FAQ
      </Typography>
      {data.edges.map(({ node }) => (
        <Accordion classes={{ expanded: classes.expanded }} key={node.id}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`FAQ-${node.id}`}
            id={`FAQ-${node.id}`}
          >
            <Typography className={classes.heading}>
              {node.frontmatter.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="body1"
              component="div"
              className={classes.content}
            >
              <MDXRenderer>{node.body}</MDXRenderer>
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  );
});

export default FaqPage;
