import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Home from './pages/Home.jsx';
import Photo from './pages/Photo.jsx';
import About from './pages/About.jsx';
import Landing from './components/Landing.jsx';

/* ---------------- mini router ---------------- */
const RouterContext = createContext({ path: '/', navigate: () => {} });

function RouterProvider({ children }) {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to) => {
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo(0, 0);
  }, []);

  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
}

function useRouter() {
  return useContext(RouterContext);
}

function Link({ to, children, className, style, ...rest }) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      className={className}
      style={style}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

/* ---------------- fixed chrome ---------------- */
function Chrome() {
  return (
    <div className="chrome">
      <p className="chrome-tag" aria-hidden="true">
        <span>
          It&rsquo;s{' '}
          <a href="https://www.instagram.com/sheikhazmatulla03/" target="_blank" rel="noreferrer" className="azzy">
            Azz&rsquo;y
          </a>
        </span>
      </p>

      <Link to="/" className="logo" aria-label="Cloud Keeper — home">
        <span className="logo-num">Cloud</span>
        <span className="logo-pill">Keeper</span>
      </Link>

      <ul className="chrome-social">
        <li><a href="mailto:shiekhazmatulla@gmail.com">Email</a></li>
        <li><a href="https://www.instagram.com/sheikhazmatulla03/" target="_blank" rel="noreferrer">Instagram</a></li>
      </ul>

      <p className="chrome-copy">© All rights reserved. 2026</p>
      <p className="chrome-credit">
        Site by{' '}
        <a href="https://www.instagram.com/sheikhazmatulla03/" target="_blank" rel="noreferrer" className="azzy">
          Azzy
        </a>
      </p>
    </div>
  );
}

/* ---------------- dial nav with clock hands ---------------- */
const DIAL_A = 234;
const DIAL_B = 155;
const SLOTS = [38, 90, 142];

const ITEMS = [
  { id: 'home',  label: 'Home',     to: '/' },
  { id: 'photo', label: 'Document', to: '/photo' },
  { id: 'about', label: 'About',    to: '/about' },
];
const N = ITEMS.length;

const rad = (d) => (d * Math.PI) / 180;
const place = (t) => ({ x: DIAL_A * Math.cos(rad(t)), y: DIAL_B * Math.sin(rad(t)) });
const slotOf = (i, active) => SLOTS[(i - active + N) % N];
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const pageFromPath = (path) => (path === '/photo' ? 'photo' : path === '/about' ? 'about' : 'home');

function DialNav() {
  const { path } = useRouter();
  const page = pageFromPath(path);
  const idx = ITEMS.findIndex((i) => i.id === page);

  const prevIdx = useRef(idx);
  const tRef = useRef(Object.fromEntries(ITEMS.map((it, i) => [it.id, slotOf(i, idx)])));
  const [, force] = useState(0);

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setScale(
        w <= 700
          ? Math.min(0.6, Math.max(0.36, w / 820))
          : Math.min(1, Math.max(0.55, Math.min(w / 1920, h / 920)))
      );
    };
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);
    return () => {
      window.removeEventListener('resize', fit);
      window.removeEventListener('orientationchange', fit);
    };
  }, []);

  useEffect(() => {
    const step = ((idx - prevIdx.current + N + 1) % N) - 1;
    prevIdx.current = idx;

    const from = { ...tRef.current };
    const to = {};
    const delta = {};
    ITEMS.forEach(({ id }, i) => {
      to[id] = slotOf(i, idx);
      const d = (((to[id] - from[id]) % 360) + 360) % 360;
      delta[id] = step > 0 ? (d === 0 ? 0 : d - 360) : d;
    });

    const t0 = performance.now();
    const D = 850;
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / D);
      const e = easeInOut(p);
      const next = {};
      for (const { id } of ITEMS) next[id] = from[id] + delta[id] * e;
      tRef.current = next;
      force((n) => n + 1);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [idx]);

  const act = place(tRef.current[page]);
  const actR = Math.hypot(act.x, act.y);
  const deg = (Math.atan2(act.x, act.y) * 180) / Math.PI;

  return (
    <nav className="dial" aria-label="Primary" style={{ transform: `scale(${scale})` }}>
      <span className="dial-hand" style={{ height: actR * 0.82, transform: `rotate(${deg + 8}deg)` }} aria-hidden="true" />
      <span className="dial-hand" style={{ height: actR * 0.46, transform: `rotate(${deg - 10}deg)` }} aria-hidden="true" />
      <span className="dial-dot" aria-hidden="true" />
      {ITEMS.map(({ id, label, to }) => {
        const { x, y } = place(tRef.current[id]);
        const o = Math.max(0, Math.min(1, (y - 20) / 50));
        return (
          <Link
            key={id}
            to={to}
            className={`dial-item ${page === id ? 'is-active' : ''}`}
            style={{
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${-y}px))`,
              opacity: o,
              pointerEvents: o < 0.4 ? 'none' : 'auto',
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ---------------- app ---------------- */
function Pages() {
  const { path } = useRouter();
  const page = pageFromPath(path);
  return (
    <div className="page-fade" key={page}>
      {page === 'photo' ? <Photo /> : page === 'about' ? <About /> : <Home />}
    </div>
  );
}

export default function App() {
  const [entered, setEntered] = useState(false);

  return (
    <RouterProvider>
      {!entered && <Landing onEnter={() => setEntered(true)} />}

      <div className={`site-shell ${entered ? 'is-in' : ''}`} aria-hidden={!entered}>
        <Chrome />
        <Pages />
        <DialNav />
      </div>
    </RouterProvider>
  );
}