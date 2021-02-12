const createURLRegEx = (slug, d3Slug=false) => {
    const isRoot = slug == "/"
    const cleanedSlug = isRoot ? '' : slug.replace(/\//g, '') + '\/?'
    const regex = d3Slug
      ? `^https?:\/\/rpsychologist\.com\/?(d3\/)?${cleanedSlug}(index\.html)?\/?$/`
      : `^https?:\/\/rpsychologist\.com\/?${cleanedSlug}(index\.html)?\/?$/`
    return regex
  }

module.exports = {createURLRegEx}