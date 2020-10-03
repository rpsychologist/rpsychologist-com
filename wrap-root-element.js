import React from 'react'
import App from './src/components/App';
import { withStyles } from '@material-ui/core/styles'
import { MDXProvider } from '@mdx-js/react'
import MuiLink from '@material-ui/core/Link'
import Typography from '@material-ui/core/Typography'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'
import CodeBlock from './src/components/code/code-block'

const StyledTableContainer = withStyles(() => ({
  root: {
    boxShadow: 'none',
    marginBottom: '2em',
  },
}))(TableContainer)


const components = {
  a: props => <MuiLink {...props} />,
  figcaption: props => <Typography {...props} />,
  p: props => <Typography variant="body1" paragraph {...props} className="article--outer" />,
  h1: props => <Typography variant="h2" component="h1" {...props} className="article--outer"/>,
  h2: props => <Typography variant="h2" {...props} className="article--outer"/>,
  h3: props => <Typography variant="h3" {...props} className="article--outer"/>,
  h4: props => <Typography variant="h4" gutterBottom {...props} className="article--outer"/>,
  h5: props => <Typography variant="h5" gutterBottom {...props} className="article--outer"/>,
  h6: props => <Typography variant="h6" gutterBottom {...props} className="article--outer"/>,
  ul: props =>  <Typography variant="body1" paragraph component="ul" {...props} className="article--outer"/>,
  li: props =>  <Typography variant="body1" component="li" {...props} className="article--outer"/>,
  ol: props =>  <Typography variant="body1" component="ol" {...props} className="article--outer"/>,
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  blockquote: props => (
    <div className="article--outer" >
      <blockquote {...props} />
    </div>
  ),
  table: props => {
    return (
      <StyledTableContainer component={Paper}>
        <Table {...props} />
      </StyledTableContainer>
    )
  },
  thead: props => {
    return <TableHead {...props} />
  },
  tbody: props => {
    return <TableBody {...props} />
  },
  tr: props => {
    return <TableRow {...props} />
  },
  td: props => {
    return <TableCell children={props.children} align={props.align === null ? 'inherit':props.align} />
  },
  th: props => {
    return <TableCell children={props.children} align={props.align === null ? 'inherit':props.align} />
  },
}

export const wrapRootElement = ({ element }) => {

  return (
    <App>
      <MDXProvider components={components}>{element}</MDXProvider>
    </App>
  )
}
