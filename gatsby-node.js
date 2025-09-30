const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const blogPostTemplate = path.resolve(`./src/templates/blog-post.js`)
  const tagTemplate = path.resolve(`./src/templates/tag-page.js`)

  const result = await graphql(`
    {
      allMarkdownRemark(
        sort: { fields: [frontmatter___date], order: DESC }
        limit: 1000
      ) {
        nodes {
          id
          fields {
            slug
          }
          frontmatter {
            tags
          }
        }
      }
    }
  `)

  if (result.errors) {
    throw result.errors
  }

  const posts = result.data.allMarkdownRemark.nodes

  // Create blog post pages
  if (posts.length > 0) {
    posts.forEach((post, index) => {
      const previousPostId = index === posts.length - 1 ? null : posts[index + 1].id
      const nextPostId = index === 0 ? null : posts[index - 1].id

      createPage({
        path: post.fields.slug,
        component: blogPostTemplate,
        context: {
          id: post.id,
          previousPostId,
          nextPostId,
        },
      })
    })
  }

  // Create tag pages
  let tags = []
  posts.forEach(post => {
    if (post.frontmatter.tags) {
      tags = tags.concat(post.frontmatter.tags)
    }
  })
  
  const uniqueTags = [...new Set(tags)]

  uniqueTags.forEach(tag => {
    createPage({
      path: `/tags/${tag}/`,
      component: tagTemplate,
      context: {
        tag: tag,
      },
    })
  })
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode })
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}