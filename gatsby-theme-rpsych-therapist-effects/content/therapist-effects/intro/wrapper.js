import React from "react";

import { makeStyles } from '@material-ui/core'
const useStyles = makeStyles(theme => ({
    root: {
        "& img": {
            width: "100%"
        },
    }
 }))

const ImgWrapper = ({children}) => {
  const classes = useStyles()

  return (
    <div className={classes.root}>
        {children}
    </div>
  )
}
export default ImgWrapper