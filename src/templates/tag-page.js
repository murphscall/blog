import React from "react"
import { Link, graphql } from "gatsby"
import Layout from "../components/Layout/Layout"
import Seo from "../components/seo"
import * as styles from "../pages/index.module.css"

const TagPageTemplate = ({ pageContext, data }) => {
  const { tag } = pageContext
  const { edges, totalCount } = data.allMarkdownRemark
  const tagHeader = `${totalCount} post${
    totalCount === 1 ? "" : "s"
  } tagged with "${tag}"`

  return (
    <Layout>
      <Seo title={`Posts tagged "${tag}"`} />
      <div className={styles.listContainer}>
        <h1>{tagHeader}</h1>
        {edges.map(({ node }) => {
          const title = node.frontmatter.title || node.fields.slug
          return (
            <article key={node.fields.slug} className={styles.postItem}>
              <header>
                <h2 className={styles.postTitle}>
                  <Link to={node.fields.slug} className={styles.postLink}>
                    {title}
                  </Link>
                </h2>
                <small className={styles.postDate}>{node.frontmatter.date}</small>
              </header>
              <section>
                <p
                  dangerouslySetInnerHTML={{
                    __html: node.frontmatter.description || node.excerpt,
                  }}
                  itemProp="description"
                />
              </section>
            </article>
          )
        })}
        <Link to="/tags">All tags</Link>
      </div>
    </Layout>
  )
}

export const pageQuery = graphql`
  query($tag: String) {
    allMarkdownRemark(
      limit: 2000
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { tags: { in: [$tag] } } }
    ) {
      totalCount
      edges {
        node {
          excerpt(pruneLength: 160)
          fields {
            slug
          }
          frontmatter {
            title
            date(formatString: "YYYY년 MM월 DD일")
          }
        }
      }
    }
  }
`

export default TagPageTemplate
