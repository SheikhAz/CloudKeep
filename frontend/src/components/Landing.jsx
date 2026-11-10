import { useEffect, useRef, useState } from 'react';
import LandingFX from './LandingFX.jsx';

/* ---- edit the copy here ---- */
const BRAND = 'Cloud Keeper';
const META = 'Est. 2026';
const EYEBROW = 'Photos · Documents · Memories';
const TITLE = [
  { text: 'Your world,' },
  { text: 'kept in the' },
  { text: 'cloud.', accent: true },
];
const TEXT =
  'A private, quietly beautiful home for everything you want to keep. Always with you, never in the way.';

/* buttons lean toward the cursor (desktop only) */
function useMagnetic() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.22}px, ${y * 0.32}px)`;
    };
    const leave = () => { el.style.transform = ''; };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);
  return ref;
}

const Arrow = () => (
  <svg className="landing-btn-arrow" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Landing({ onEnter }) {
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const cursorRef = useRef(null);
  const loginRef = useMagnetic();
  const signRef = useMagnetic();
  const [ready, setReady] = useState(false);     /* video buffered — fade in */
  const [leaving, setLeaving] = useState(false); /* exit transition running */
  const [shown, setShown] = useState(false);     /* intro animation started */

  /* autoplay can reject on some browsers — retry once on first tap */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    const onTouch = () => { tryPlay(); window.removeEventListener('pointerdown', onTouch); };
    window.addEventListener('pointerdown', onTouch);
    return () => window.removeEventListener('pointerdown', onTouch);
  }, []);

  /* start the intro one frame after mount so the CSS transitions actually run */
  useEffect(() => {
    let a = requestAnimationFrame(() => { a = requestAnimationFrame(() => setShown(true)); });
    return () => cancelAnimationFrame(a);
  }, []);

  /* custom cursor (mouse devices only) */
  useEffect(() => {
    const root = rootRef.current;
    const el = cursorRef.current;
    if (!root || !el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let x = window.innerWidth / 2, y = window.innerHeight / 2, cx = x, cy = y, raf;
    const move = (e) => { x = e.clientX; y = e.clientY; root.classList.add('has-cursor'); };
    const over = (e) => el.classList.toggle('is-hover', !!e.target.closest?.('button'));
    const tick = () => {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerover', over);
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      root.removeEventListener('pointerover', over);
    };
  }, []);

  const enter = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onEnter, 650); /* matches the CSS fade duration */
  };

  return (
    <div
      ref={rootRef}
      className={`landing ${ready ? 'is-ready' : ''} ${leaving ? 'is-leaving' : ''} ${shown ? 'is-in' : ''}`}
    >
      {/* media attribute = the browser downloads ONLY the matching source */}
      <video
        ref={videoRef}
        className="landing-video"
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        disablePictureInPicture
        onCanPlay={() => setReady(true)}
        aria-hidden="true"
      >
        <source src="/videos/landing-mobile.mp4" media="(max-width: 700px)" type="video/mp4" />
        <source src="/videos/landing-desktop.mp4" type="video/mp4" />
      </video>

      {/* three.js particles + rings, drawn on top of the video */}
      <LandingFX leaving={leaving} />

      <div className="landing-scrim" aria-hidden="true" />
      <div className="landing-grain" aria-hidden="true" />
      <div className="landing-frame" aria-hidden="true"><i /><i /><i /><i /></div>

      <header className="landing-top reveal">
        <span className="landing-mark">{BRAND}</span>
        <span className="landing-meta">{META}</span>
      </header>

      <div className="landing-ui">
        <div className="landing-head">
          <p className="landing-eyebrow reveal" style={{ '--d': '.25s' }}>{EYEBROW}</p>
          <h1 className="landing-title" aria-label={TITLE.map((l) => l.text).join(' ')}>
            {TITLE.map((l, i) => (
              <span className="line" key={i} aria-hidden="true">
                <span className="line-inner" style={{ '--i': i }}>
                  {l.accent ? <em>{l.text}</em> : l.text}
                </span>
              </span>
            ))}
          </h1>
        </div>

        <div className="landing-aside">
          <p className="landing-text reveal" style={{ '--d': '.85s' }}>{TEXT}</p>

          <div className="landing-actions reveal" style={{ '--d': '1s' }}>
            <button ref={loginRef} type="button" className="landing-btn landing-btn-solid" onClick={enter}>
              <span>Login</span><Arrow />
            </button>
            <button ref={signRef} type="button" className="landing-btn landing-btn-ghost" onClick={enter}>
              <span>Sign Up</span>
            </button>
          </div>

          <button type="button" className="landing-skip reveal" style={{ '--d': '1.15s' }} onClick={enter}>
            Enter site
          </button>
        </div>
      </div>

      <div ref={cursorRef} className="landing-cursor" aria-hidden="true" />
    </div>
  );
}