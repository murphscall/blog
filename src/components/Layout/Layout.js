import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Header from "../Header/Header"
import Sidebar from "../Sidebar/Sidebar"
import "./layout.css"
import { FaGithub, FaEnvelope } from "react-icons/fa"

const Layout = ({ children, tableOfContents }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  const hasToc = !!tableOfContents

  return (
    <div className="siteContainer">
      <Header siteTitle={data.site.siteMetadata?.title || `Title`} />
      <div className="pageGrid">
        <div className="mainContent">
          <div className={`mobileSidebar ${hasToc ? "has-toc" : ""}`}>
            <Sidebar tableOfContents={tableOfContents} />
          </div>
          <main>{children}</main>
        </div>
        <div className="desktopSidebar">
          <Sidebar tableOfContents={tableOfContents} />
        </div>
      </div>

      <footer
        style={{
          padding: `var(--space-4)`,
          marginTop: `var(--space-6)`,
          fontSize: `var(--font-sm)`,
          textAlign: `center`,
          borderTop: `1px solid #eee`,
        }}
      >
        <a
          href="https://github.com/murphscall" // Placeholder
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: `var(--color-text)`, margin: `0 10px` }}
        >
          <FaGithub size={24} />
        </a>
        <a
          href="mailto:wlsgnwkd22@gmail.com" // Corrected mailto link
          style={{ color: `var(--color-text)`, margin: `0 10px` }}
        >
          <FaEnvelope size={24} />
        </a>
        <p style={{ marginTop: `var(--space-2)` }}>
          © {new Date().getFullYear()} JeDevlog
        </p>
      </footer>
    </div>
  )
}

export default Layout
