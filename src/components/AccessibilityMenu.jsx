import { useId, useRef, useState } from 'react';

import { usePreferences } from '../context/PreferencesContext.jsx';
import { useDismiss } from '../hooks/useCommon.js';
import { Icon } from './Icon.jsx';

const THEMES = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'Auto', icon: 'monitor' },
];

const TEXT_SIZES = [
  { value: 'default', label: 'A', description: 'Default text size' },
  { value: 'large', label: 'A+', description: 'Large text' },
  { value: 'larger', label: 'A++', description: 'Larger text' },
];

/** A labelled on/off switch built from a native checkbox. */
function Switch({ label, description, checked, onChange }) {
  const id = useId();
  return (
    <div className="switch-row">
      <div>
        <label htmlFor={id} className="switch-row__label">
          {label}
        </label>
        <p id={`${id}-description`} className="switch-row__description">
          {description}
        </p>
      </div>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="switch"
        checked={checked}
        aria-describedby={`${id}-description`}
        onChange={(event) => onChange(event.target.checked)}
      />
    </div>
  );
}

/** A group of radio buttons styled as a segmented control. */
function Segmented({ legend, name, options, value, onChange }) {
  return (
    <fieldset className="segmented">
      <legend className="segmented__legend">{legend}</legend>
      <div className="segmented__options">
        {options.map((option) => (
          <label key={option.value} className="segmented__option">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              aria-label={option.description}
            />
            <span>
              {option.icon ? <Icon name={option.icon} size={16} /> : null}
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * The "Display & accessibility" panel in the header. Lets anyone adjust the
 * theme, text size, contrast, motion, font, and link underlines.
 */
export function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const panelId = useId();
  const { preferences, updatePreferences, resetPreferences } = usePreferences();

  useDismiss(containerRef, open, (reason) => {
    setOpen(false);
    if (reason === 'escape') buttonRef.current?.focus();
  });

  return (
    <div className="popover-anchor" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="icon-button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="accessibility" size={22} title="Display and accessibility settings" />
      </button>

      <div id={panelId} className="popover popover--settings" hidden={!open}>
        <h2 className="popover__title">Display &amp; accessibility</h2>

        <Segmented
          legend="Theme"
          name="theme"
          options={THEMES.map((theme) => ({ ...theme, description: `${theme.label} theme` }))}
          value={preferences.theme}
          onChange={(theme) => updatePreferences({ theme })}
        />
        <Segmented
          legend="Text size"
          name="text-size"
          options={TEXT_SIZES}
          value={preferences.textSize}
          onChange={(textSize) => updatePreferences({ textSize })}
        />

        <Switch
          label="High contrast"
          description="Stronger colors and borders."
          checked={preferences.contrast === 'high'}
          onChange={(on) => updatePreferences({ contrast: on ? 'high' : 'normal' })}
        />
        <Switch
          label="Reduce motion"
          description="Turns off animations and transitions."
          checked={preferences.motion === 'reduce'}
          onChange={(on) => updatePreferences({ motion: on ? 'reduce' : 'system' })}
        />
        <Switch
          label="Easy-reading font"
          description="Uses Atkinson Hyperlegible everywhere."
          checked={preferences.font === 'legible'}
          onChange={(on) => updatePreferences({ font: on ? 'legible' : 'default' })}
        />
        <Switch
          label="Underline links"
          description="Makes every link easy to spot."
          checked={preferences.underlineLinks}
          onChange={(on) => updatePreferences({ underlineLinks: on })}
        />

        <button type="button" className="button button--ghost button--sm popover__reset" onClick={resetPreferences}>
          <Icon name="history" size={16} />
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
