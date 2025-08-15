import React, { createRef, useLayoutEffect } from 'react';
import * as styles from './comments.module.css';

const Comments = () => {
  const containerRef = createRef();

  useLayoutEffect(() => {
    const utterances = document.createElement('script');
    const attributes = {
      src: 'https://utteranc.es/client.js',
      repo: 'murphscall/blog',
      'issue-term': 'pathname',
      label: 'comment',
      theme: 'github-light',
      crossorigin: 'anonymous',
      async: 'true',
    };

    Object.entries(attributes).forEach(([key, value]) => {
      utterances.setAttribute(key, value);
    });

    containerRef.current.appendChild(utterances);
  }, [containerRef]);

  return <div ref={containerRef} className={styles.commentsContainer} />;
};

export default Comments;
