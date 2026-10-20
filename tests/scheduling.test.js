/**
 * Unit tests for the availability algorithm. Run with `npm test`.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { availableUnits, peakUsage, slotAvailability, toBooking } from '../server/scheduling.js';

const HOUR = 60 * 60 * 1000;
const booking = (startHour, endHour, quantity = 1) => ({ start: startHour * HOUR, end: endHour * HOUR, quantity });

describe('peakUsage', () => {
  it('returns 0 when nothing is booked', () => {
    assert.equal(peakUsage([], 0, 10 * HOUR), 0);
  });

  it('adds up bookings that overlap', () => {
    const bookings = [booking(9, 12, 2), booking(10, 11, 3)];
    assert.equal(peakUsage(bookings, 9 * HOUR, 12 * HOUR), 5);
  });

  it('does not count bookings that only touch end-to-start', () => {
    const bookings = [booking(9, 10, 1), booking(10, 11, 1)];
    assert.equal(peakUsage(bookings, 9 * HOUR, 11 * HOUR), 1);
  });

  it('ignores bookings outside the window', () => {
    const bookings = [booking(7, 8, 4), booking(13, 14, 4)];
    assert.equal(peakUsage(bookings, 9 * HOUR, 12 * HOUR), 0);
  });

  it('finds the true peak, not the total, when bookings do not overlap each other', () => {
    const bookings = [booking(9, 10, 3), booking(11, 12, 2)];
    assert.equal(peakUsage(bookings, 9 * HOUR, 12 * HOUR), 3);
  });
});

describe('availableUnits', () => {
  it('subtracts the peak from the total quantity', () => {
    assert.equal(availableUnits(10, [booking(9, 12, 4)], 10 * HOUR, 11 * HOUR), 6);
  });

  it('never goes below zero', () => {
    assert.equal(availableUnits(1, [booking(9, 12, 2)], 9 * HOUR, 10 * HOUR), 0);
  });
});

describe('toBooking', () => {
  it('treats an overdue checkout as unavailable indefinitely', () => {
    const row = { id: 1, start_at: 0, end_at: 5 * HOUR, quantity: 1, status: 'checked_out' };
    assert.equal(toBooking(row, 6 * HOUR).end, Number.POSITIVE_INFINITY);
  });

  it('keeps the normal end time for an on-time checkout', () => {
    const row = { id: 1, start_at: 0, end_at: 5 * HOUR, quantity: 1, status: 'checked_out' };
    assert.equal(toBooking(row, 4 * HOUR).end, 5 * HOUR);
  });
});

describe('slotAvailability', () => {
  it('reports free units for each slot', () => {
    const slots = slotAvailability(2, [booking(10, 11, 1)], 9 * HOUR, 12 * HOUR, HOUR);
    assert.deepEqual(
      slots.map((slot) => slot.available),
      [2, 1, 2],
    );
  });
});
