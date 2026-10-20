import { useId } from 'react';

import { Icon } from './Icon.jsx';

/**
 * A labelled form field with an optional hint and error message.
 * The input is passed as a function so it receives the correct id and
 * aria attributes, which link the label, hint, and error together for
 * screen readers.
 *
 *   <Field label="Email" error={errors.email}>
 *     {(props) => <input type="email" {...props} />}
 *   </Field>
 */
export function Field({ label, hint, error, required, optional, className = '', children }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field ${error ? 'field--invalid' : ''} ${className}`.trim()}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? (
          <span className="field__required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
        {optional ? <span className="field__optional"> (optional)</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      ) : null}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required })}
      {error ? (
        <p id={errorId} className="field__error">
          <Icon name="alert" size={16} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** A form-level error message; role="alert" makes screen readers announce it right away. */
export function FormError({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert--danger" role="alert">
      <Icon name="alert" className="alert__icon" />
      <div className="alert__body">
        <p>{message}</p>
      </div>
    </div>
  );
}
