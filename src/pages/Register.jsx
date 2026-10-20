import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';

import { PASSWORD_MIN_LENGTH } from '../../shared/constants.js';
import { LogoMark } from '../components/art/Logo.jsx';
import { Field, FormError } from '../components/Field.jsx';
import { Icon } from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/useCommon.js';
import { PasswordInput, safeNext } from './Login.jsx';

/**
 * A simple strength estimate. Length matters most for passphrases, so the
 * meter mostly rewards length and gives a small bonus for variety.
 */
function passwordStrength(password) {
  if (password.length === 0) return { score: 0, label: '' };
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { score: 1, label: `Too short: ${PASSWORD_MIN_LENGTH - password.length} more characters needed` };
  }
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length;
  if (password.length >= 20 || (password.length >= 16 && variety >= 3)) return { score: 4, label: 'Strong' };
  if (password.length >= 17 || variety >= 2) return { score: 3, label: 'Good' };
  return { score: 2, label: 'Okay' };
}

export default function Register() {
  useDocumentTitle('Create an account');
  const { user, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [values, setValues] = useState({ name: '', email: '', title: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const problems = {};
    if (values.name.trim().length < 2) problems.name = 'Enter your full name.';
    if (!values.email.trim()) problems.email = 'Enter your school email address.';
    if (values.password.length < PASSWORD_MIN_LENGTH) problems.password = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
    setErrors(problems);
    setFormError('');
    if (Object.keys(problems).length > 0) return;

    setBusy(true);
    try {
      const created = await register(values);
      showToast(`Welcome to Commons, ${created.name.split(' ')[0]}!`);
      navigate(safeNext(params.get('next'), '/dashboard'), { replace: true });
    } catch (error) {
      setErrors(error.fields ?? {});
      setFormError(error.message);
      setBusy(false);
    }
  }

  const strength = passwordStrength(values.password);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <LogoMark size={40} />
        </div>
        <h1 className="auth-card__title" tabIndex={-1}>
          Create your account
        </h1>
        <p className="auth-card__lead">It takes less than a minute. You can reserve as soon as you are signed up.</p>

        <form onSubmit={handleSubmit} noValidate className="stack">
          <FormError message={formError} />
          <Field label="Full name" error={errors.name} required>
            {(props) => (
              <input {...props} className="input" autoComplete="name" maxLength={80} value={values.name} onChange={(event) => update('name', event.target.value)} />
            )}
          </Field>
          <Field label="School email" error={errors.email} required>
            {(props) => (
              <input {...props} type="email" className="input" autoComplete="email" value={values.email} onChange={(event) => update('email', event.target.value)} />
            )}
          </Field>
          <Field label="Grade or role" hint="For example “Grade 10 student” or “Art teacher.”" error={errors.title} optional>
            {(props) => (
              <input {...props} className="input" maxLength={60} value={values.title} onChange={(event) => update('title', event.target.value)} />
            )}
          </Field>
          <Field
            label="Password"
            hint={`At least ${PASSWORD_MIN_LENGTH} characters. A phrase of four or more words, like “orange kite morning walk,” is strong and easy to remember.`}
            error={errors.password}
            required
          >
            {(props) => (
              <PasswordInput {...props} autoComplete="new-password" value={values.password} onChange={(event) => update('password', event.target.value)} />
            )}
          </Field>

          {values.password ? (
            <div className="strength" aria-live="polite">
              <div className={`strength__bar strength__bar--${strength.score}`} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <p className="strength__label">Password strength: {strength.label}</p>
            </div>
          ) : null}

          <button type="submit" className="button button--primary button--block button--lg" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-card__switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <p className="auth-card__note">
          <Icon name="lock" size={16} />
          Your password is never stored, only a secure scrambled version (an scrypt hash).
        </p>
      </div>
    </div>
  );
}
