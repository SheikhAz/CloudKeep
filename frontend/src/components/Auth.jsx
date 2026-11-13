import { useEffect, useState } from 'react';
import AuthScene from './AuthScene.jsx';
/* ==================== EDIT COPY HERE ==================== */
const COPY = {
  login: {
    script: 'Welcome back.',
    sans: 'Your cloud kept everything safe.',
    text: 'One private space for every photo, file and memory — encrypted, organised and always within reach.',
    cta: 'Log in',
    switchText: 'New to Cloud Keeper?',
    switchCta: 'Create an account',
    switchTo: '/signup',
  },
  signup: {
    script: 'Every memory, kept.',
    sans: 'Start your private cloud today.',
    text: 'Photos, documents and favourite moments in one calm, encrypted space — ready on every device you own.',
    cta: 'Create account',
    switchText: 'Already have an account?',
    switchCta: 'Log in',
    switchTo: '/login',
  },
};

const FIELDS = {
  login: ['email', 'password'],
  signup: ['name', 'email', 'password'],
};
const META = {
  name:     { label: 'Name',     type: 'text',     placeholder: 'Your name' },
  email:    { label: 'Email',    type: 'email',    placeholder: 'you@example.com' },
  password: { label: 'Password', type: 'password', placeholder: '••••••••' },
};

/* the little wave glyph inside the dark squircle */
const Wave = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M4.5 12.5c1.8-4.6 4.2-4.6 6 0s4.2 4.6 6 0"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export default function Auth({ mode = 'login', navigate, onEnter }) {
  const c = COPY[mode] ?? COPY.login;
  const fields = FIELDS[mode] ?? FIELDS.login;
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setError(''); setBusy(false); }, [mode]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (mode === 'signup' && !form.name.trim()) return setError('Please tell us your name.');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Please enter a valid email address.');
    if (form.password.length < 6) return setError('Password needs at least 6 characters.');
    setError('');
    setBusy(true);
    try {
      /* TODO: real auth — point this at your Cloudflare Worker endpoint, e.g.
         await fetch(`https://your-worker.workers.dev/${mode}`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(form),
         });
      */
      await new Promise((r) => setTimeout(r, 650));
      onEnter();
    } catch {
      setBusy(false);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className={`auth auth-${mode}`}>
      <AuthScene />
      <div className="auth-shade" aria-hidden="true" />

      {/* inset frame with corner brackets */}
      <div className="auth-frame" aria-hidden="true">
        <span className="auth-corner tl" /><span className="auth-corner tr" />
        <span className="auth-corner bl" /><span className="auth-corner br" />
      </div>

      <button type="button" className="auth-back" onClick={() => navigate('/')}>
        ← Back
      </button>

      {/* headline — top center, script over light sans */}
      <header className="auth-head">
        <p className="auth-script">{c.script}</p>
        <p className="auth-sans">{c.sans}</p>
      </header>

      {/* bottom stack: text, fields, cream pill, switch link */}
      <div className="auth-panel">
        <p className="auth-text">{c.text}</p>

        <form className="auth-form" onSubmit={submit} noValidate>
          {fields.map((key, i) => {
            const m = META[key];
            return (
              <label className="auth-field" key={key}>
                <span className="sr-only">{m.label}</span>
                <input
                  type={m.type}
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={m.placeholder}
                  autoComplete={key === 'password' ? (mode === 'signup' ? 'new-password' : 'current-password') : key}
                  autoFocus={i === 0}
                  required
                />
              </label>
            );
          })}

          <p className="auth-error" role="alert">{error}</p>

          <button type="submit" className="auth-cta" disabled={busy}>
            <span>{busy ? 'Opening…' : c.cta}</span>
            <span className="auth-cta-icon" aria-hidden="true"><Wave /></span>
          </button>
        </form>

        <p className="auth-switch">
          {c.switchText}{' '}
          <button type="button" onClick={() => navigate(c.switchTo)}>{c.switchCta}</button>
        </p>
      </div>
    </div>
  );
}