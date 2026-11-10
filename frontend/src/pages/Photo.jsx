import WebGLStrip from '../components/WebGLStrip.jsx';

const PHOTOS = [
  { name: 'Elle Q',     seed: 'm213-elle' },
  { name: 'Sophia S',   seed: 'm213-sophia' },
  { name: 'Arianne L',  seed: 'm213-arianne' },
  { name: 'May Siu',    seed: 'm213-may' },
  { name: 'Josie Lane', seed: 'm213-josie' },
  { name: 'Ali D',      seed: 'm213-ali' },
  { name: 'Sasha D',    seed: 'm213-sasha' },
  { name: 'Marlee B',   seed: 'm213-marlee' },
  { name: 'Freya W',    seed: 'm213-freya' },
  { name: 'Graziela S', seed: 'm213-graziela' },
  { name: 'Syd G',      seed: 'm213-syd' },
  { name: 'Aleya B',    seed: 'm213-aleya' },
];

const YOFFS = [12, -16, 8, -10, 14, -6, 10, -14, 6, -12, 16, -8];

/* built once at module level so the strip is not rebuilt on re-render */
const ITEMS = PHOTOS.map((p, i) => ({
  src: `https://picsum.photos/seed/${p.seed}/720/1000`,
  name: p.name,
  vh: 0.78,
  ratio: 0.72,
  y: YOFFS[i % YOFFS.length],
}));

export default function Photo() {
  return (
    <main className="strip-page">
      <WebGLStrip items={ITEMS} gap={70} drift={1} radiusFactor={6} top={0.47} slope={0.3} />
    </main>
  );
}