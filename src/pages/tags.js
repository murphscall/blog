import React from "react"
import { Link, graphql } from "gatsby"
import Layout from "../components/Layout/Layout"
import Seo from "../components/seo"

const TagsPage = ({ data }) => {
  const tags = data.allMarkdownRemark.group

  return (
    <Layout>
      <Seo title="Tags" />
      <div>
        <h1>All Tags</h1>
        <ul>
          {tags.map(tag => (
            <li key={tag.fieldValue}>
              <Link to={`/tags/${tag.fieldValue}/`}>
                {tag.fieldValue} ({tag.totalCount})
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  )
}

export const pageQuery = graphql`
  query {
    allMarkdownRemark(limit: 2000) {
      group(field: { frontmatter: { tags: SELECT }}) {
        fieldValue
        totalCount
      }
    }
  }
`

export default TagsPage
