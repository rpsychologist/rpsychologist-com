import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Link } from 'gatsby'
import AppBar from '@material-ui/core/AppBar'
import Drawer from '@material-ui/core/Drawer'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import Button from '@material-ui/core/Button'
import MenuIcon from '@material-ui/icons/Menu'
import TwitterIcon from '@material-ui/icons/Twitter'
import GitHubIcon from '@material-ui/icons/GitHub'
import RssFeedIcon from '@material-ui/icons/RssFeed'
import Logo from './Logo'

const useStyles = makeStyles(theme => ({
  appBar: {
    boxShadow: 'none',
  },
  logoContainer: {
    flexGrow: 1,
  },
  logo: {
    [theme.breakpoints.down('sm')]: {
      maxWidth: 200,
    },
    maxWidth: 250,
  },
  appBarButton: {
    textTransform: 'none',
  },
  sectionMobile: {
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  menuButton: {
    marginRight: 0,
  },
  drawerPaper: {
    minWidth: 200,
    paddingTop: '2em',
  },
  sectionDesktop: {
    display: 'none',
    [theme.breakpoints.up('md')]: {
      display: 'flex',
    },
  },
}))

const MenuList = () => {
  const classes = useStyles()
  return (
    <>
      <Button
        to="/about"
        aria-label="Goto about page"
        color="inherit"
        component={Link}
        className={classes.appBarButton}
      >
        About
      </Button>
      <Button
        to="/posts"
        aria-label="Go to list of all posts"
        color="inherit"
        component={Link}
        className={classes.appBarButton}
      >
        Posts
      </Button>
      <Button
        to="/viz"
        component="button"
        color="inherit"
        aria-label="Go to list of visualizations"
        component={Link}
        className={classes.appBarButton}
      >
        Visualizations
      </Button>
      <IconButton
        color="inherit"
        aria-label="Go to Kristoffers twitter"
        href="https://twitter.com/krstoffr"
      >
        <TwitterIcon />
      </IconButton>
      <IconButton
        color="inherit"
        aria-label="Go to Kristoffers GitHub"
        href="https://github.com/rpsychologist"
      >
        <GitHubIcon />
      </IconButton>
      <IconButton
        color="inherit"
        href="https://feeds.feedburner.com/RPsychologist"
        aria-label="Go to RSS feed"
      >
        <RssFeedIcon />
      </IconButton>
    </>
  )
}

const HeaderAppBar = React.memo(() => {
  const classes = useStyles()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <AppBar position="static" color={'inherit'} className={classes.appBar}>
      <Toolbar>
        <div className={classes.logoContainer}>
          <Link to="/">
            <div className={classes.logo}>
              <Logo />
            </div>
          </Link>
        </div>
        <div className={classes.sectionDesktop}>
          <MenuList />
        </div>
        <div className={classes.sectionMobile}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
            <MenuIcon className={classes.menuButton} />
          </IconButton>
        </div>
      </Toolbar>
      <Drawer
        variant="temporary"
        anchor={'right'}
        open={mobileOpen}
        onClose={handleDrawerToggle}
        classes={{
          paper: classes.drawerPaper,
        }}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        <MenuList />
      </Drawer>
    </AppBar>
  )
})
export default HeaderAppBar
