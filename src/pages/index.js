import React, { useState, useRef, useCallback } from "react"
import { Link, graphql } from "gatsby"
import Layout from "../components/Layout/Layout"
import Seo from "../components/seo"
import * as styles from "./index.module.css"

const IndexPage = ({ data }) => {
  const allPosts = data.allMarkdownRemark.nodes
  const [postsToShow, setPostsToShow] = useState(allPosts.slice(0, 10))
  const [hasMore, setHasMore] = useState(allPosts.length > 10)
  const observer = useRef()

  const lastPostElementRef = useCallback(node => {
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPostsToShow(prevPosts => {
          const newPosts = allPosts.slice(prevPosts.length, prevPosts.length + 10)
          if (prevPosts.length + 10 >= allPosts.length) {
            setHasMore(false)
          }
          return [...prevPosts, ...newPosts]
        })
      }
    })
    if (node) observer.current.observe(node)
  }, [allPosts, hasMore])

  return (
    <Layout>
      <Seo title="Home" />
      <div className={styles.listContainer}>
        <h1>기록</h1>
        {postsToShow.map((post, index) => {
          const { title, date, tags, description } = post.frontmatter
          const { slug } = post.fields
          const article = (
            <article key={slug} className={styles.postItem}>
              <header>
                <h2 className={styles.postTitle}>
                  <Link to={slug} className={styles.postLink}>{title}</Link>
                </h2>
                <small className={styles.postDate}>{date}</small>
              </header>
              <section>
                <p>{description}</p>
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
          if (postsToShow.length === index + 1) {
            return React.cloneElement(article, { ref: lastPostElementRef })
          }
          return article
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
          date(formatString: "YYYY년 MM월 DD일")
          title
          tags
          description
        }
      }
    }
  }
`

export default IndexPage