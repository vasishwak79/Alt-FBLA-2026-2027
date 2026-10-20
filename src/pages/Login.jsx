import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';

import { LogoMark } from '../components/art/Logo.jsx';
import { Field, FormError } from '../components/Field.jsx';
import { Icon } from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/useCommon.js';

/** Only follow "next" links that stay on this site (prevents open redirects). */
export function safeNext(value, fallback) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

/** A password input with a show/hide toggle. */
export function PasswordInput({ value, onChange, autoComplete, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className="input"
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
      />
      <button type="button" className="password-input__toggle" aria-pressed={visible} onClick={() => setVisible((current) => !current)}>
        <Icon name={visible ? 'eye-off' : 'eye'} size={18} />
        <span>{visible ? 'Hide' : 'Show'}</span>
        <span className="sr-only"> password</span>
      </button>
    </div>
  );
}

export default function Login() {
  useDocumentTitle('Sign in');
  const { user, login, demoLogin, demoMode } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={safeNext(params.get('next'), user.role === 'admin' ? '/admin' : '/dashboard')} replace />;
  }

  function finish(signedIn) {
    showToast(`Welcome, ${signedIn.name.split(' ')[0]}!`);
    navigate(safeNext(params.get('next'), signedIn.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const problems = {};
    if (!email.trim()) problems.email = 'Enter your email address.';
    if (!password) problems.password = 'Enter your password.';
    setErrors(problems);
    setFormError('');
    if (Object.keys(problems).length > 0) return;

    setBusy(true);
    try {
      finish(await login(email, password));
    } catch (error) {
      setErrors(error.fields ?? {});
      setFormError(error.message);
      setBusy(false);
    }
  }

  async function handleDemo(role) {
    setBusy(true);
    setFormError('');
    try {
      finish(await demoLogin(role));
    } catch (error) {
      setFormError(error.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <LogoMark size={40} />
        </div>
        <h1 className="auth-card__title" tabIndex={-1}>
          Sign in to Commons
        </h1>
        <p className="auth-card__lead">Use your school email to reserve resources and track requests.</p>

        <form onSubmit={handleSubmit} noValidate className="stack">
          <FormError message={formError} />
          <Field label="Email" error={errors.email} required>
            {(props) => (
              <input
                {...props}
                type="email"
                className="input"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            )}
          </Field>
          <Field label="Password" error={errors.password} required>
            {(props) => (
              <PasswordInput {...props} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            )}
          </Field>
          <button type="submit" className="button button--primary button--block button--lg" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-card__switch">
          New to Commons? <Link to={`/register${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`}>Create an account</Link>
        </p>

        {demoMode ? (
          <section className="demo-box" aria-labelledby="demo-heading">
            <h2 id="demo-heading" className="demo-box__title">
              <Icon name="sparkle" size={18} /> Exploring the demo?
            </h2>
            <p>Sign in instantly as one of the sample accounts.</p>
            <div className="demo-box__buttons">
              <button type="button" className="button button--secondary" disabled={busy} onClick={() => handleDemo('member')}>
                <Icon name="user" size={18} />
                Student (Avery)
              </button>
              <button type="button" className="button button--secondary" disabled={busy} onClick={() => handleDemo('admin')}>
                <Icon name="shield" size={18} />
                Staff (Jordan)
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
