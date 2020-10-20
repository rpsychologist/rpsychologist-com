import React from 'react'
import Social from "./Social"
import Typography from '@material-ui/core/Typography'


const SocialShare = ({slug, title}) => {
    return(
        <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <Typography
          variant="subtitle2"
          component="span"
          color="textSecondary"
        >
          Share:
        </Typography>
        <Social
          slug={slug}
          title={title}
        />
      </div>
    )
}
export default SocialShare