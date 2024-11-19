import React from 'react'
import { Grid, makeStyles } from '@material-ui/core'
import TwitterIcon from '@material-ui/icons/Twitter'
import FacebookIcon from '@material-ui/icons/Facebook'
import IconButton from '@material-ui/core/IconButton'
import BlueskyIcon from './BlueskyIcon'

const useStyles = makeStyles(() => ({}))

const Social = ({ slug, title, via }) => {
  const classes = useStyles()

  const url = `https://rpsychologist.com/${slug.replace(/^\//g, '')}`
  const twitterText =
    title.length > 242 ? `${title.substring(0, 239)}...` : title
  const twitterVia = via ? '&via=krstoffr' : ''
  const blueskyVia = via ? "@rpsychologist.com" : ''
  return (
    <>
      <IconButton
        href={`https://bsky.app/intent/compose?text=${encodeURIComponent(
          `
          ${twitterText.replace("@krstoffr", "@rpsychologist.com")} 
          
          ${url} 
          
          ${blueskyVia}`
        )}`}
        target="_blank"
        rel="noopener"
      >
        <BlueskyIcon />
      </IconButton>
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
