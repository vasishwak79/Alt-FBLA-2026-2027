import { useEffect, useId, useRef } from 'react';

import { Icon } from './Icon.jsx';

/**
 * An accessible dialog built on the native <dialog> element. showModal()
 * gives us focus trapping, Escape-to-close, and an inert background for
 * free, and focus returns to the button that opened it when it closes.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Clicking the dimmed backdrop (outside the panel) closes the dialog.
  function handleClick(event) {
    if (event.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={`modal modal--${size}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={handleClick}
    >
      {open ? (
        <div className="modal__panel">
          <header className="modal__header">
            <div>
              <h2 id={titleId} className="modal__title">
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="modal__description">
                  {description}
                </p>
              ) : null}
            </div>
            <button type="button" className="icon-button" onClick={onClose}>
              <Icon name="x" title="Close dialog" />
            </button>
          </header>
          <div className="modal__body">{children}</div>
          {footer ? <footer className="modal__footer">{footer}</footer> : null}
        </div>
      ) : null}
    </dialog>
  );
}

/** A yes/no confirmation dialog for actions that cannot be undone. */
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', tone = 'danger', busy, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="button button--secondary" onClick={onCancel}>
            Keep it
          </button>
          <button type="button" className={`button button--${tone}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
