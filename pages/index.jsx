import dynamic from 'next/dynamic';
import React from 'react';

const AppNoSSR = dynamic(() => import('../src/App'), { ssr: false });

export default function Home() {
  return <AppNoSSR />;
}
