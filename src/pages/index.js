import React from "react"
import { Link, graphql } from "gatsby"
import Layout from "../components/Layout/Layout"
import Seo from "../components/seo"
import * as styles from "./index.module.css"

const IndexPage = ({ data }) => {
  const posts = data.allMarkdownRemark.nodes

  return (
    <Layout>
      <Seo title="Home" />
      <div className={styles.listContainer}>
        <h1>Posts</h1>
        {posts.map(post => {
          const { title, date, tags } = post.frontmatter
          const { slug } = post.fields
          return (
            <article key={slug} className={styles.postItem}>
              <header>
                <h2 className={styles.postTitle}>
                  <Link to={slug} className={styles.postLink}>{title}</Link>
                </h2>
                <small className={styles.postDate}>{date}</small>
              </header>
              <section>
                <p>{post.excerpt}</p>
              </section>
              {tags && tags.length > 0 && (
                <footer className={styles.postTags}>
                  {tags.map(tag => (
                    <Link key={tag} to={`/tags/${tag}/`} className={styles.tagLink}>
                      {tag}
                    </Link>
                  ))}
                </footer>
              )}
            </article>
          )
        })}
      </div>
    </Layout>
  )
}

export const query = graphql`
  query {
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          title
          tags
        }
        excerpt(pruneLength: 100)
      }
    }
  }
`

export default IndexPage