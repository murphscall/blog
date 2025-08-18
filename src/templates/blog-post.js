import React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/Layout/Layout"
import Comments from "../components/Comments/Comments"
import Seo from "../components/seo"
import * as styles from "./blog-post.module.css"

const BlogPost = ({ data }) => {
  const { markdownRemark: post, previous, next } = data
  return (
    <Layout tableOfContents={post.tableOfContents}>
      <div>
        <h1>{post.frontmatter.title}</h1>
        <div style={{ color: '#888', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
          <span>@JeDev</span>
          <span style={{ margin: '0 0.5rem' }}>·</span>
          <span>{post.frontmatter.date}</span>
          {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
            <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              {post.frontmatter.tags.map(tag => (
                <Link key={tag} to={`/tags/${tag}`} style={{
                  backgroundColor: '#eee',
                  color: '#333',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  marginRight: '0.5rem',
                  fontSize: '0.8rem'
                }}>
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="post-content" dangerouslySetInnerHTML={{ __html: post.html }} />

        <nav className={styles.postNavigation}>
          <div>
            {previous && (
              <Link to={previous.fields.slug} rel="prev" className={styles.prevLink}>
                <div className={styles.navSubtext}>← 이전 글</div>
                <div className={styles.navTitle}>{previous.frontmatter.title}</div>
              </Link>
            )}
          </div>
          <div>
            {next && (
              <Link to={next.fields.slug} rel="next" className={styles.nextLink}>
                <div className={styles.navSubtext}>다음 글 →</div>
                <div className={styles.navTitle}>{next.frontmatter.title}</div>
              </Link>
            )}
          </div>
        </nav>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <Comments />
        </div>
      </div>
    </Layout>
  )
}

export const Head = ({ data }) => <Seo title={data.markdownRemark.frontmatter.title} />

export const query = graphql`
  query BlogPostById(
    $id: String!
    $previousPostId: String
    $nextPostId: String
  ) {
    markdownRemark(id: { eq: $id }) {
      id
      html
      tableOfContents
      frontmatter {
        title
        date(formatString: "YYYY년 MM월 DD일")
        tags
      }
    }
    previous: markdownRemark(id: { eq: $previousPostId }) {
      fields {
        slug
      }
      frontmatter {
        title
      }
    }
    next: markdownRemark(id: { eq: $nextPostId }) {
      fields {
        slug
      }
      frontmatter {
        title
      }
    }
  }
`

export default BlogPost
