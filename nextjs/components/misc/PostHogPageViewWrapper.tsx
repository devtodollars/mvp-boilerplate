'use client';

import dynamic from 'next/dynamic';

const PostHogPageView = dynamic(() => import('../../app/PostHogPageView'), {
  ssr: false
});

export default function PostHogPageViewWrapper() {
  return <PostHogPageView />;
} 