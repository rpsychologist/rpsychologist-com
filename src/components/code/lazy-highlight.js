import React from 'react'
import loadable from '@loadable/component'
import PrismCore from 'prismjs/components/prism-core'
import 'prismjs/components/prism-r'

const LazyHighlight = loadable(async () => {
  const Module = await import(`prism-react-renderer`)
  const Highlight = Module.default
  const defaultProps = Module.defaultProps
  return props => <Highlight Prism={PrismCore} {...props} />
})

export default LazyHighlight
