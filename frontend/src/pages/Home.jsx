import WebGLStrip from '../components/WebGLStrip.jsx';

const ITEMS = [
  { src: 'https://picsum.photos/seed/m213-deeds/560/720',   w: 330, h: 424, y: 30 },
  { src: 'https://picsum.photos/seed/m213-gold/520/680',    w: 280, h: 366, y: -10 },
  { src: 'https://picsum.photos/seed/m213-fur/560/720',     w: 320, h: 411, y: 40 },
  { src: 'https://picsum.photos/seed/m213-white/560/720',   w: 330, h: 424, y: 20 },
  { src: 'https://picsum.photos/seed/m213-vogue/520/700',   w: 290, h: 391, y: -20 },
  { src: 'https://picsum.photos/seed/m213-numero/560/720',  w: 330, h: 424, y: 35 },
  { src: 'https://picsum.photos/seed/m213-score/560/720',   w: 310, h: 398, y: 0 },
  { src: 'https://picsum.photos/seed/m213-swm/560/720',     w: 320, h: 411, y: 25 },
  { src: 'https://picsum.photos/seed/m213-curtain/520/700', w: 300, h: 404, y: -15 },
];

/* phone-only overrides, defined at module level so the strip isn't rebuilt on re-render */
const MOBILE = { shiftY: 0.09 };

export default function Home() {
  return (
    <main className="strip-page">
      {/* slope: cards get bigger moving left, smaller moving right.
          gap is a little wider so the big left cards never touch. */}
      <WebGLStrip
        items={ITEMS}
        gap={170}
        drift={0.65}
        radiusFactor={2.2}
        top={0.40}
        slope={0.4}
        mobile={MOBILE}
      />
    </main>
  );
}