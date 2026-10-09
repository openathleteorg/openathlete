// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import {
  isKeyHeld,
  isOverlayOpen,
  shortcutFor,
  trackHeldKeys,
} from './shortcuts';

const press = (key: string, fields: Partial<KeyboardEvent> = {}) => ({
  key,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  repeat: false,
  target: document.body,
  ...fields,
});

describe('calendar shortcuts', () => {
  it('maps keys to actions, whatever the case', () => {
    expect(shortcutFor(press('t'), false)).toBe('today');
    expect(shortcutFor(press('T'), false)).toBe('today');
    expect(shortcutFor(press('ArrowLeft'), false)).toBe('previous');
    expect(shortcutFor(press('ArrowRight'), false)).toBe('next');
    expect(shortcutFor(press('w'), false)).toBe('weekView');
    expect(shortcutFor(press('m'), false)).toBe('monthView');
    expect(shortcutFor(press('?'), false)).toBe('help');
    expect(shortcutFor(press('x'), false)).toBeNull();
  });

  it('leaves typing, browser shortcuts and open dialogs alone', () => {
    const input = document.createElement('input');
    expect(shortcutFor(press('t', { target: input }), false)).toBeNull();
    expect(shortcutFor(press('t', { metaKey: true }), false)).toBeNull();
    expect(shortcutFor(press('ArrowLeft', { altKey: true }), false)).toBeNull();
    expect(
      shortcutFor(press('ArrowRight', { repeat: true }), false),
    ).toBeNull();
    expect(shortcutFor(press('t'), true)).toBeNull();
  });

  it('keeps arrow keys for the tabs and lists that use them', () => {
    const tabs = document.createElement('div');
    tabs.setAttribute('role', 'tablist');
    const tab = document.createElement('button');
    tabs.append(tab);
    expect(shortcutFor(press('ArrowRight', { target: tab }), false)).toBeNull();
    // Letters still work there
    expect(shortcutFor(press('t', { target: tab }), false)).toBe('today');
  });

  it('sees an open dialog or menu', () => {
    const root = document.createElement('div');
    expect(isOverlayOpen(root)).toBe(false);
    root.innerHTML = '<div role="menu"></div>';
    expect(isOverlayOpen(root)).toBe(true);
  });
});

describe('held keys', () => {
  let stop: () => void = () => {};
  afterEach(() => stop());

  it('tracks a key while it is held, and forgets it on blur', () => {
    stop = trackHeldKeys(window);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'C' }));
    expect(isKeyHeld('c')).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'c' }));
    expect(isKeyHeld('c')).toBe(false);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    window.dispatchEvent(new Event('blur'));
    expect(isKeyHeld('e')).toBe(false);
  });
});
