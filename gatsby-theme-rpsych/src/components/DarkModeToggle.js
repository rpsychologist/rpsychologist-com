import React from 'react'
import { DarkModeContext } from './ThemeContext'
import IconButton from '@material-ui/core/IconButton'
import Brightness3Icon from '@material-ui/icons/Brightness3'
import Brightness7Icon from '@material-ui/icons/Brightness7'
import Tooltip from '@material-ui/core/Tooltip';
import { useTranslation } from "react-i18next"

const DarkToggle = () => {
  const darkMode = React.useContext(DarkModeContext)
  const {t} = useTranslation('blog')
  const tooltipLabel = darkMode.value ? t("Turn off dark mode") : t("Turn on dark mode")
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
