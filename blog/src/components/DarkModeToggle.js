import React from 'react'
import { DarkModeContext } from './ThemeContext'
import IconButton from '@material-ui/core/IconButton'
import Brightness3Icon from '@material-ui/icons/Brightness3'
import Brightness7Icon from '@material-ui/icons/Brightness7'
import Tooltip from '@material-ui/core/Tooltip';

const DarkToggle = () => {
  const darkMode = React.useContext(DarkModeContext)
  const tooltipLabel = darkMode.value ? 'Dark mode off' : 'Dark mode on'
  return (
    <Tooltip title={tooltipLabel} aria-label={tooltipLabel}>
    <IconButton
      aria-label="Toggle dark mode"
      color="inherit"
      onClick={darkMode.toggle}
    >
    {darkMode.value ? <Brightness7Icon /> : <Brightness3Icon />}
    </IconButton>
    </Tooltip>
  )
}

export default DarkToggle
