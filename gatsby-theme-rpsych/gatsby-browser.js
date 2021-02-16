import "katex/dist/katex.min.css"
import "./src/styles/styles.css"
export { wrapRootElement } from './wrap-root-element'
export { wrapPageElement  } from './wrap-page-element'

export const onServiceWorkerUpdateFound = () => {
  if (
    window.confirm(
      "This site has been updated. Please reload the site for a smoother experience! Do you want to reload the page?"
    )
  ) {
    window.location.reload(true);
  }
};