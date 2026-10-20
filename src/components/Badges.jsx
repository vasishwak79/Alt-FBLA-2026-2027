/**
 * Status badges. Every badge pairs color with an icon and text, so meaning
 * never depends on color alone (WCAG 1.4.1, Use of Color).
 */

import { PRIORITIES, labelFor } from '../../shared/constants.js';
import { Icon } from './Icon.jsx';

export function Badge({ tone = 'neutral', icon, children }) {
  return (
    <span className={`badge badge--${tone}`}>
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
    </span>
  );
}

/** Turns a reservation's stored status into what the member should see right now. */
export function describeReservation(reservation, now = Date.now()) {
  const { status, start, end, kind, overdue } = reservation;

  if (status === 'checked_out') {
    return overdue
      ? { label: 'Overdue', tone: 'danger', icon: 'alert' }
      : { label: 'Checked out', tone: 'info', icon: 'package' };
  }
  if (status === 'approved') {
    if (end <= now) {
      return kind === 'space'
        ? { label: 'Completed', tone: 'neutral', icon: 'check' }
        : { label: 'Not picked up', tone: 'neutral', icon: 'x-circle' };
    }
    if (start <= now) {
      return kind === 'space'
        ? { label: 'Happening now', tone: 'success', icon: 'clock' }
        : { label: 'Ready for pickup', tone: 'success', icon: 'package' };
    }
    return { label: 'Confirmed', tone: 'success', icon: 'check-circle' };
  }

  const fixed = {
    pending: { label: 'Awaiting approval', tone: 'warning', icon: 'clock' },
    returned: { label: 'Returned', tone: 'neutral', icon: 'check' },
    denied: { label: 'Denied', tone: 'danger', icon: 'x-circle' },
    cancelled: { label: 'Cancelled', tone: 'neutral', icon: 'x' },
  };
  return fixed[status] ?? { label: status, tone: 'neutral' };
}

export function ReservationBadge({ reservation }) {
  const { label, tone, icon } = describeReservation(reservation);
  return (
    <Badge tone={tone} icon={icon}>
      {label}
    </Badge>
  );
}

const REQUEST_STATUS_STYLES = {
  open: { label: 'Open', tone: 'info', icon: 'inbox' },
  in_progress: { label: 'In progress', tone: 'warning', icon: 'clock' },
  resolved: { label: 'Resolved', tone: 'success', icon: 'check-circle' },
  closed: { label: 'Closed', tone: 'neutral', icon: 'check' },
};

export function RequestStatusBadge({ status }) {
  const { label, tone, icon } = REQUEST_STATUS_STYLES[status] ?? REQUEST_STATUS_STYLES.open;
  return (
    <Badge tone={tone} icon={icon}>
      {label}
    </Badge>
  );
}

const PRIORITY_TONES = { low: 'neutral', normal: 'neutral', high: 'warning', urgent: 'danger' };

export function PriorityBadge({ priority }) {
  return (
    <Badge tone={PRIORITY_TONES[priority]} icon={priority === 'urgent' || priority === 'high' ? 'alert' : undefined}>
      {labelFor(PRIORITIES, priority)} priority
    </Badge>
  );
}

/** "3 of 8 available", "Booked now", or "Under maintenance". */
export function AvailabilityBadge({ resource }) {
  if (resource.status === 'maintenance') {
    return (
      <Badge tone="warning" icon="wrench">
        Under maintenance
      </Badge>
    );
  }
  if (resource.status === 'retired') {
    return <Badge tone="neutral">Retired</Badge>;
  }
  if (resource.availableNow === 0) {
    return (
      <Badge tone="danger" icon="x-circle">
        {resource.kind === 'space' ? 'In use now' : 'All in use'}
      </Badge>
    );
  }
  if (resource.kind === 'space' || resource.quantity === 1) {
    return (
      <Badge tone="success" icon="check-circle">
        Available now
      </Badge>
    );
  }
  return (
    <Badge tone="success" icon="check-circle">
      {resource.availableNow} of {resource.quantity} available
    </Badge>
  );
}
