const { readFileSync } = require("fs")
const xpath = require("xpath")
const xdom = require("xmldom")
const path = require(`path`)
const _ = require("lodash")
const { createFilePath } = require(`gatsby-source-filesystem`)

const createURLRegEx = (slug, d3Slug=false) => {
  const isRoot = slug == "/"
  const cleanedSlug = isRoot ? '' : slug.replace(/\//g, '') + '\/?'
  const regex = d3Slug
    ? `^https?:\/\/rpsychologist\.com\/?(d3\/)?${cleanedSlug}(index\.html)?\/?$/`
    : `^https?:\/\/rpsychologist\.com\/?${cleanedSlug}(index\.html)?\/?$/`
  return regex
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const blogPost = require.resolve(`./src/templates/blog-post.js`)
  return graphql(
    `
      {
        allMdx(
          filter: {fileAbsolutePath: {regex: "/content/blog/"}}
          sort: { fields: [frontmatter___date], order: DESC }
          limit: 1000
        ) {
          edges {
            node {
              id
              fields {
                slug
              }
              frontmatter {
                title
              }
              body
            }
          }
        }
        tagsGroup: allMdx(limit: 2000) {
          group(field: frontmatter___tags) {
            fieldValue
          }
        }
      }
    `
  ).then(result => {
    if (result.errors) {
      throw result.errors
    }

    // Create blog posts pages.
    const posts = result.data.allMdx.edges

    posts.forEach((post, index) => {
      const previous = index === posts.length - 1 ? null : posts[index + 1].node
      const next = index === 0 ? null : posts[index - 1].node
      createPage({
        path: post.node.fields.slug,
        component: blogPost,
        context: {
          slug: post.node.fields.slug,
          permalinkRegEx: createURLRegEx(post.node.fields.slug),
          previous,
          next,
        },
      })
    })
    // Create blog post list pages
    const postsPerPage = 5
    const numPages = Math.ceil(posts.length / postsPerPage)

    Array.from({ length: numPages }).forEach((_, i) => {
      createPage({
        path: i === 0 ? `/` : `/${i + 1}`,
        component: require.resolve('./src/templates/index.js'),
        context: {
          limit: postsPerPage,
          skip: i * postsPerPage,
          permalinkRegEx: createURLRegEx('/'),
          numPages,
          currentPage: i + 1,
        },
      })
    })
     // Extract tag data from query
  const tags = result.data.tagsGroup.group
  // Make tag pages
  tags.forEach(tag => {
    createPage({
      path: `/tags/${_.kebabCase(tag.fieldValue)}/`,
      component: require.resolve("./src/templates/tags.js"),
      context: {
        tag: tag.fieldValue,
      },
    })
  })
  })
}


exports.onCreatePage = ({ page, actions }) => {
  const { createPage, deletePage } = actions
  deletePage(page)
  createPage({
    ...page,
    context: {
      ...page.context,
      permalinkRegEx: createURLRegEx(page.path, d3Slug=true),
    },
  })
}

// exports.onCreateNode = ({ node, actions, getNode }) => {
//   const { createNodeField } = actions

//   if (node.internal.type === `Mdx`) {
//     let value;
//     // use YAML slug if it exists
//     if (node.frontmatter && node.frontmatter.slug) {
//       value = `/${node.frontmatter.slug}`
//     } else {
//       value = createFilePath({ node, getNode });
//     }
    
//     createNodeField({
//       name: `slug`,
//       node,
//       value,
//     })
//   }
// }

// Forked from `gatsby-source-disqus-xml`
// by Chad Lee
// https://github.com/chadly/gatsby-source-disqus-xml
// License MIT 
const dom = xdom.DOMParser;
exports.sourceNodes = (
	{ actions: { createNode }, createNodeId, createContentDigest },
	{ filePath }
) => {
	const xml = readFileSync('content/comments/rpsychologist-disqus-archive.xml', 'utf8');
	const threads = loadCommentDataFromXml(xml);

	threads.forEach((t,i) => {
		createNode({
			id: createNodeId(`disqus-thread-${i}`),
			threadId: i,
			link: t.link,
			comments: t.comments,
			parent: null,
			children: [],
			mediaType: "application/json",
			internal: {
				type: "DisqusThread",
				content: JSON.stringify(t),
				contentDigest: createContentDigest(t)
			}
		});
	});
};
function loadCommentDataFromXml(xml) {
	const doc = new dom().parseFromString(xml);

	const select = xpath.useNamespaces({
		d: "http://disqus.com",
		dsq: "http://disqus.com/disqus-internals"
	});

	const nodes = select("/d:disqus/d:thread", doc);

	return nodes.map(node => {
    const dqId = select("string(@dsq:id)", node);
		return {
			id: select("string(d:id)", node),
			link: select("string(d:link)", node),
			comments: select(`/d:disqus/d:post[d:thread/@dsq:id='${dqId}']`, doc).map(
				cnode => ({
					id: select("string(@dsq:id)", cnode),
					parentId: select("string(d:parent/@dsq:id)", cnode),
					author: {
						name: select("string(d:author/d:name)", cnode),
						username: select("string(d:author/d:username)", cnode)
					},
					createdAt: select("string(d:createdAt)", cnode),
					message: select("string(d:message)", cnode)
				})
			)
		};
	});
}