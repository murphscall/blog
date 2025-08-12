import React, { createRef, useLayoutEffect } from 'react';

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

  return <div ref={containerRef} />;
};

export default Comments;
