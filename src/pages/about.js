import React from "react"
import Layout from "../components/Layout/Layout"
import Seo from "../components/seo"

const AboutPage = () => (
  <Layout>
    <Seo title="About" />
    <h1>About Me</h1>
    <p>This is the about page. You can write a short bio here.</p>
    <p>
      Welcome to my blog! I write about technology, programming, and other
      things I'm passionate about.
    </p>
  </Layout>
)

export default AboutPage
