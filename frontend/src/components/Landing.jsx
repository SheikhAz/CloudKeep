import { useEffect, useRef, useState } from 'react';
import LoopVideo from './LoopVideo.jsx';
/* ---- edit the copy here ---- */
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
  const startRef = useMagnetic();
  const loginRef = useMagnetic();
  const signRef = useMagnetic();
  const [ready, setReady] = useState(false);     /* video buffered — fade in */
  const [leaving, setLeaving] = useState(false); /* exit transition running */
  const [shown, setShown] = useState(false);     /* intro (Get Started) animation */
  const [started, setStarted] = useState(false); /* Get Started clicked — build the content */
  const [awake, setAwake] = useState(false);     /* cursor moved / screen touched — keep Get Started visible */

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

  /* bring "Get Started" back on any cursor move / touch / key press */
  useEffect(() => {
    const wake = () => setAwake(true);
    const events = ['pointermove', 'pointerdown', 'touchstart', 'keydown'];
    events.forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, wake));
  }, []);

  const start = (e) => {
    e.currentTarget.blur();
    setStarted(true);
  };

  const enter = (e) => {
    if (leaving) return;
    e.currentTarget.blur();
    setLeaving(true);
    setTimeout(onEnter, 650);
  };

  return (
    <div
      ref={rootRef}
      className={`landing ${ready ? 'is-ready' : ''} ${leaving ? 'is-leaving' : ''} ${shown ? 'is-in' : ''} ${started ? 'is-started' : ''} ${awake ? 'is-awake' : ''}`}
    >
      {/* media attribute = the browser downloads ONLY the matching source */}
      <LoopVideo onReady={() => setReady(true)} />

      <div className="landing-vignette" aria-hidden="true" />
      <div className="landing-scrim" aria-hidden="true" />
      <div className="landing-grain" aria-hidden="true" />
      <div className="landing-beam" aria-hidden="true" />

      {/* step 1: only this is visible on arrival */}
      <div className="landing-start" aria-hidden={started}>
        <button
          ref={startRef}
          type="button"
          className="landing-btn landing-btn-solid"
          onClick={start}
          tabIndex={started ? -1 : 0}
        >
          <span>Get Started</span><Arrow />
        </button>
      </div>

      {/* step 2: builds in after Get Started */}
      <div className="landing-ui" aria-hidden={!started}>
        <div className="landing-head">
          <p className="landing-eyebrow reveal" style={{ '--d': '.35s' }}>{EYEBROW}</p>
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
          <p className="landing-text reveal" style={{ '--d': '1.15s' }}>{TEXT}</p>

          <div className="landing-actions">
            <button
              ref={loginRef}
              type="button"
              className="landing-btn landing-btn-solid reveal"
              style={{ '--d': '1.4s' }}
              onClick={enter}
              tabIndex={started ? 0 : -1}
            >
              <span>Login</span><Arrow />
            </button>
            <button
              ref={signRef}
              type="button"
              className="landing-btn landing-btn-ghost reveal"
              style={{ '--d': '1.55s' }}
              onClick={enter}
              tabIndex={started ? 0 : -1}
            >
              <span>Sign Up</span>
            </button>
          </div>
        </div>
      </div>

      <div ref={cursorRef} className="landing-cursor" aria-hidden="true" />
    </div>
  );
}