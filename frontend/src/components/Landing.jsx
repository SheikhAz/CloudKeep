import { memo, useCallback, useEffect, useRef, useState } from 'react';
import LoopVideo from './LoopVideo.jsx';

/* ---- edit the copy here ---- */
const EYEBROW = 'Cloud Keeper · Personal storage';
const TITLE = [
  { text: 'Your documents.' },
  { text: 'Your Cloudflare.,' },
  { text: 'Absolute privacy.', accent: true },
];
const TEXT =
  'Your personal document vault, routed straight to your own Cloudflare endpoint. Nothing stored on our servers. Nothing compromised.';

/* ---- typing speed (milliseconds) ---- */
const START_MS = 450;   // wait after clicking Begin
const TITLE_MS = 46;    // per heading character
const TEXT_MS = 10;     // per paragraph character
const LINE_GAP = 80;    // pause between heading lines
const TEXT_GAP = 220;   // pause before the paragraph starts
const END_MS = 150;     // pause after the last character, before the buttons arrive
const PAUSE = { ',': 120, '.': 220 };

/* ---- typing schedule: the moment every character appears ---- */
const SEGS = [...TITLE.map((l) => Array.from(l.text)), Array.from(TEXT)];
const TEXT_SEG = SEGS.length - 1;
const OFFSETS = [];
const TIMES = [];
let TOTAL = 0;
let clock = START_MS;
SEGS.forEach((chars, si) => {
  OFFSETS.push(TOTAL);
  if (si > 0) clock += si === TEXT_SEG ? TEXT_GAP : LINE_GAP;
  chars.forEach((ch) => {
    TIMES.push(clock);
    clock += (si === TEXT_SEG ? TEXT_MS : TITLE_MS) + (PAUSE[ch] || 0);
    TOTAL += 1;
  });
});
const END = clock + END_MS;

/* the video never needs to re-render while text is typing */
const Background = memo(LoopVideo);

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

export default function Landing({ onLogin, onSignup }) {
  const rootRef = useRef(null);
  const cursorRef = useRef(null);
  const caretRef = useRef(null);
  const charEls = useRef([]);          /* every character span, indexed 0..TOTAL-1 */
  const rafRef = useRef(0);
  const t0Ref = useRef(0);
  const doneRef = useRef(false);
  const startRef = useMagnetic();
  const loginRef = useMagnetic();
  const signRef = useMagnetic();

  const [ready, setReady] = useState(false);
  const [shown, setShown] = useState(false);
  const [started, setStarted] = useState(false);
  const [awake, setAwake] = useState(false);
  const [done, setDone] = useState(false);

  const onReady = useCallback(() => setReady(true), []);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    cancelAnimationFrame(rafRef.current);
    const els = charEls.current;
    for (let i = 0; i < els.length; i += 1) els[i]?.classList.add('on');
    setDone(true); /* the ONLY setState the typing ever triggers */
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

  useEffect(() => {
    const wake = () => setAwake(true);
    const events = ['pointermove', 'pointerdown', 'touchstart', 'keydown'];
    events.forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, wake));
  }, []);

  /* typewriter: pure DOM updates — React renders nothing while typing */
  useEffect(() => {
    if (!started) return;
    t0Ref.current = performance.now();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }

    let k = 0;
    const els = charEls.current;
    const caret = caretRef.current;

    const tick = (now) => {
      if (doneRef.current) return;
      const elapsed = now - t0Ref.current;
      while (k < TOTAL && TIMES[k] <= elapsed) {
        const el = els[k];
        if (el) {
          el.classList.add('on');   /* the char fades in via CSS */
          if (caret) el.after(caret); /* caret follows, zero-width so no reflow */
        }
        k += 1;
      }
      if (elapsed >= END) { finish(); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [started, finish]);

  const start = (e) => {
    e.currentTarget.blur();
    setStarted(true);
  };

  /* tap anywhere while it is typing = show everything now */
  const skip = () => {
    if (!started || doneRef.current) return;
    if (performance.now() - t0Ref.current < 800) return; // ignore a double-click on Begin
    finish();
  };

  const go = (e, fn) => {
    e.currentTarget.blur();
    fn();
  };

  const setChar = (index) => (el) => { charEls.current[index] = el; };

  return (
    <div
      ref={rootRef}
      onClick={skip}
      className={`landing ${ready ? 'is-ready' : ''}${shown ? 'is-in' : ''} ${started ? 'is-started' : ''} ${awake ? 'is-awake' : ''} ${done ? 'is-done' : ''}`}
    >
      <Background onReady={onReady} />

      <div className="landing-vignette" aria-hidden="true" />
      <div className="landing-scrim" aria-hidden="true" />
      <div className="landing-grain" aria-hidden="true" />
      <div className="landing-beam" aria-hidden="true" />

      {/* step 1 */}
      <div className="landing-start" aria-hidden={started}>
        <button
          ref={startRef}
          type="button"
          className="landing-btn landing-btn-solid"
          onClick={start}
          tabIndex={started ? -1 : 0}
        >
          <span>Begin</span><Arrow />
        </button>
      </div>

      {/* step 2 */}
      <div className="landing-ui" aria-hidden={!started}>
        <div className="landing-head">
          <h1 className="landing-title" aria-label={TITLE.map((l) => l.text).join(' ')}>
            {TITLE.map((l, i) => {
              const line = SEGS[i].map((ch, ci) => (
                <span className="tw-ch" key={ci} ref={setChar(OFFSETS[i] + ci)}>{ch}</span>
              ));
              return (
                <span className="line" key={i} aria-hidden="true">
                  {i === 0 && <span ref={caretRef} className="tw-caret" aria-hidden="true" />}
                  {l.accent ? <em>{line}</em> : line}
                </span>
              );
            })}
          </h1>
        </div>

        <div className="landing-aside landing-card">
          <p className="landing-text">
            <span className="sr-only">{TEXT}</span>
            <span aria-hidden="true">
              {SEGS[TEXT_SEG].map((ch, ci) => (
                <span className="tw-ch" key={ci} ref={setChar(OFFSETS[TEXT_SEG] + ci)}>{ch}</span>
              ))}
            </span>
          </p>

          <div className="landing-actions" aria-hidden={!done}>
            <button
              ref={loginRef}
              type="button"
              className="landing-btn landing-btn-solid"
              style={{ '--d': '0s' }}
              onClick={(e) => go(e, onLogin)}
              tabIndex={done ? 0 : -1}
            >
              <span>Log in</span><Arrow />
            </button>
            <button
              ref={signRef}
              type="button"
              className="landing-btn landing-btn-ghost"
              style={{ '--d': '.14s' }}
              onClick={(e) => go(e, onSignup)}
              tabIndex={done ? 0 : -1}
            >
              <span>Create account</span>
            </button>
          </div>
        </div>
      </div>

      <div ref={cursorRef} className="landing-cursor" aria-hidden="true" />
    </div>
  );
}