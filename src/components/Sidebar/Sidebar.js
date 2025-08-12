import React, { useEffect, useRef } from "react"
import { Link, useStaticQuery, graphql } from "gatsby"
import * as styles from "./Sidebar.module.css"

const Sidebar = ({ tableOfContents }) => {
  const data = useStaticQuery(graphql`
    query {
      allMarkdownRemark(limit: 2000) {
        group(field: { frontmatter: { tags: SELECT }}) {
          fieldValue
          totalCount
        }
        totalCount
      }
    }
  `)

  const tags = data.allMarkdownRemark.group
  const totalCount = data.allMarkdownRemark.totalCount

  const tocRef = useRef(null)

  useEffect(() => {
    const tocNode = tocRef.current
    if (!tocNode) return

    const handleClick = e => {
      if (e.target.tagName === "A" && e.target.hash) {
        e.preventDefault()
        const id = decodeURIComponent(e.target.hash.substring(1))
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }
    }

    tocNode.addEventListener("click", handleClick)

    return () => {
      tocNode.removeEventListener("click", handleClick)
    }
  }, [tableOfContents])

  // If tableOfContents is passed, render it. Otherwise, render tags.
  if (tableOfContents) {
    return (
      <aside className={styles.sidebar}>
        <h4>목차</h4>
        <div
          ref={tocRef}
          className={styles.toc}
          dangerouslySetInnerHTML={{ __html: tableOfContents }}
        />
      </aside>
    )
  }

  return (
    <aside className={styles.sidebar}>
      <h4>Tags</h4>
      <ul className={styles.tagList}>
        <li key="all-posts">
          <Link to="/" activeClassName={styles.activeLink}>
            All Posts ({totalCount})
          </Link>
        </li>
        {tags.map(tag => (
          <li key={tag.fieldValue}>
            <Link
              to={`/tags/${tag.fieldValue}/`}
              activeClassName={styles.activeLink}
            >
              {tag.fieldValue} ({tag.totalCount})
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default Sidebar