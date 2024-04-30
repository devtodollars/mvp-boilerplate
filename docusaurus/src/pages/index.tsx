import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';
import HeroHome from '../components/hero-home';
import FeaturesHome from '../components/features-home';
import AboutMe from '../components/about-me';
import Cta from '../components/cta';

export default function Home(): JSX.Element {
  return (
    <Layout
      title="Home"
      description="Helping developers become founders">
      <HeroHome />
      <FeaturesHome />
      <AboutMe />
      <Cta />
    </Layout>
  );
}
