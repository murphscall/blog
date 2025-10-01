import React from "react"
import Layout from "../components/Layout/Layout"
import Seo from "../components/seo"

const AboutPage = () => (
  <Layout>
    <Seo title="About" />
    <h1>About Me</h1>
    <p>안녕하세요, 백엔드 개발자 김진후입니다.</p>
    <p>
      저는 주로 Java와 Spring 을 활용해 웹 서비스 백엔드를 개발하고 있으며,
      데이터베이스 설계와 시스템 아키텍처에 관심이 많습니다.
    </p>
    <p>
      이 블로그에서는 개발하면서 배운 지식, 문제 해결 과정, 그리고 제가 흥미롭게
      생각하는 기술들을 기록하고 공유하려 합니다.
    </p>
    <p>읽어주셔서 감사합니다. 함께 성장할 수 있기를 기대합니다!</p>
  </Layout>
)

export default AboutPage
