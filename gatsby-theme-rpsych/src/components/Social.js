import React from 'react'
import { Grid, makeStyles } from '@material-ui/core'
import TwitterIcon from '@material-ui/icons/Twitter'
import FacebookIcon from '@material-ui/icons/Facebook'
import IconButton from '@material-ui/core/IconButton'

const useStyles = makeStyles(() => ({}))

const Social = ({ slug, title, via }) => {
  const classes = useStyles()

  const url = `https://rpsychologist.com/${slug.replace(/^\//g, '')}`
  const twitterText =
    title.length > 242 ? `${title.substring(0, 239)}...` : title
  const twitterVia = via ? '&via=krstoffr' : ''
  return (
    <>
      <IconButton
        href={`https://twitter.com/intent/tweet?text=${twitterText}&url=${url}${twitterVia}`}
        target="_blank"
        rel="noopener"
      >
        <TwitterIcon />
      </IconButton>
      <IconButton
        href={`http://www.facebook.com/sharer.php?u=${url}&t=${title}`}
        target="_blank"
        rel="noopener"
      >
        <FacebookIcon />
      </IconButton>
    </>
  )
}
export default Social
