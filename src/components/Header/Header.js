import React, { useState, useEffect } from "react"
import { Link } from "gatsby"
import { FaHome, FaUser } from "react-icons/fa"
import * as styles from "./header.module.css"

const Header = ({ siteTitle }) => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={styles.content}>
        <Link to="/" className={styles.titleLink}>
          {siteTitle}
        </Link>
        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink} activeClassName={styles.activeNavLink}>
            <FaHome size={24} />
          </Link>
          <Link to="/about" className={styles.navLink} activeClassName={styles.activeNavLink}>
            <FaUser size={24} />
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header