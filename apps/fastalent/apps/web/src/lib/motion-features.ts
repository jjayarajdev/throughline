// Lazy-loaded framer-motion features (~15KB on demand, not in main bundle).
// Usage: <LazyMotion features={loadFeatures} strict>
export default function loadFeatures() {
  return import('framer-motion').then((mod) => mod.domAnimation);
}
