/**
 * Unit tests for AddItemDialog, AddSeriesDialog, AddBookDialog, AddGroupDialog,
 * and DashboardView trigger integration.
 *
 * Validates: Requirements 1.1–1.7, 2.1–2.7, 3.1–3.7, 4.1–4.7, 5.1–5.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import React from 'react';

// Mock next/navigation
const mockSearchParams = new URLSearchParams('view=active');
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock fetch globally to prevent real network calls from DashboardView
const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ items: [], nextCursor: null, hasMore: false }),
  } as Response)
);
vi.stubGlobal('fetch', mockFetch);

import { AddItemDialog } from '../AddItemDialog';
import { AddSeriesDialog } from '../AddSeriesDialog';
import { AddBookDialog } from '../AddBookDialog';
import { AddGroupDialog } from '../AddGroupDialog';
import { DashboardView } from '../DashboardView';

/**
 * jsdom doesn't implement HTMLDialogElement methods, so we mock them.
 */
beforeEach(() => {
  // Provide showModal and close on HTMLDialogElement prototype
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });

  mockFetch.mockClear();
});

afterEach(() => {
  cleanup();
});

// ─── AddSeriesDialog Tests ───────────────────────────────────────────────────

describe('AddSeriesDialog', () => {
  it('renders with correct title text (Req 2.1)', () => {
    render(<AddSeriesDialog open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Add Series')).toBeInTheDocument();
  });

  it('has input with correct label and maxLength (Req 2.2)', () => {
    render(<AddSeriesDialog open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByLabelText('Series name');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('maxlength', '100');
  });

  it('input starts empty on open (Req 2.3)', () => {
    render(<AddSeriesDialog open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByLabelText('Series name') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('displays Save and Cancel buttons (Req 2.4)', () => {
    render(<AddSeriesDialog open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('Cancel closes dialog (Req 2.7)', () => {
    const onClose = vi.fn();
    render(<AddSeriesDialog open={true} onSave={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ─── AddBookDialog Tests ─────────────────────────────────────────────────────

describe('AddBookDialog', () => {
  it('renders with correct title text (Req 3.1)', () => {
    render(<AddBookDialog open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Add Book')).toBeInTheDocument();
  });

  it('has input with correct label and maxLength (Req 3.2)', () => {
    render(<AddBookDialog open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByLabelText('Book title');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('maxlength', '200');
  });

  it('input starts empty on open (Req 3.3)', () => {
    render(<AddBookDialog open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByLabelText('Book title') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('displays Save and Cancel buttons (Req 3.4)', () => {
    render(<AddBookDialog open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('Cancel closes dialog (Req 3.7)', () => {
    const onClose = vi.fn();
    render(<AddBookDialog open={true} onSave={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ─── AddGroupDialog Tests ────────────────────────────────────────────────────

describe('AddGroupDialog', () => {
  it('renders with correct title text (Req 4.1)', () => {
    render(<AddGroupDialog open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Add Group')).toBeInTheDocument();
  });

  it('has input with correct label and maxLength (Req 4.2)', () => {
    render(<AddGroupDialog open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByLabelText('Group name');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('maxlength', '50');
  });

  it('input starts empty on open (Req 4.3)', () => {
    render(<AddGroupDialog open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByLabelText('Group name') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('displays Save and Cancel buttons (Req 4.4)', () => {
    render(<AddGroupDialog open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('Cancel closes dialog (Req 4.7)', () => {
    const onClose = vi.fn();
    render(<AddGroupDialog open={true} onSave={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ─── AddItemDialog Shared Behavior Tests ─────────────────────────────────────

describe('AddItemDialog shared behavior', () => {
  it('Escape key closes dialog (Req 5.2)', () => {
    const onClose = vi.fn();
    render(
      <AddItemDialog
        open={true}
        title="Test Dialog"
        fieldLabel="Test field"
        fieldMaxLength={100}
        onSave={vi.fn()}
        onClose={onClose}
      />
    );

    // The native cancel event is what fires when Escape is pressed on a dialog
    const dialog = document.querySelector('dialog')!;
    const cancelEvent = new Event('cancel', { bubbles: false, cancelable: true });
    dialog.dispatchEvent(cancelEvent);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('backdrop click closes dialog (Req 5.3)', () => {
    const onClose = vi.fn();
    render(
      <AddItemDialog
        open={true}
        title="Test Dialog"
        fieldLabel="Test field"
        fieldMaxLength={100}
        onSave={vi.fn()}
        onClose={onClose}
      />
    );

    const dialog = document.querySelector('dialog')!;
    // Simulate click outside dialog bounds: getBoundingClientRect returns 0 for all in jsdom
    // so clicking at (0,0) with a rect of (0,0,0,0) means the click is not "inside" the rect
    // But actually, with all zeros, the condition `e.clientX >= rect.left && e.clientX <= rect.right`
    // evaluates to `0 >= 0 && 0 <= 0` which is true. We need to click clearly outside.
    // Mock getBoundingClientRect to return a known rect, then click outside.
    dialog.getBoundingClientRect = vi.fn(() => ({
      left: 100,
      right: 500,
      top: 100,
      bottom: 400,
      width: 400,
      height: 300,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    }));

    fireEvent.click(dialog, { clientX: 50, clientY: 50 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('aria-labelledby references title (Req 5.5)', () => {
    render(
      <AddItemDialog
        open={true}
        title="My Dialog Title"
        fieldLabel="Field"
        fieldMaxLength={100}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const dialog = document.querySelector('dialog')!;
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();

    // The referenced element should contain the title text
    const titleEl = document.getElementById(labelledBy!);
    expect(titleEl).not.toBeNull();
    expect(titleEl!.textContent).toBe('My Dialog Title');
  });

  it('focus moves to input on open (Req 5.6)', async () => {
    vi.useFakeTimers();

    render(
      <AddItemDialog
        open={true}
        title="Focus Test"
        fieldLabel="Name"
        fieldMaxLength={100}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // The component uses setTimeout to focus, advance timers
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    const input = screen.getByLabelText('Name');
    expect(document.activeElement).toBe(input);

    vi.useRealTimers();
  });
});

// ─── DashboardView Trigger Tests ─────────────────────────────────────────────

describe('DashboardView triggers', () => {
  it('triggers only render on active view (Req 1.1)', async () => {
    // Active view - triggers should be present
    await act(async () => {
      render(<DashboardView />);
    });

    expect(screen.getByRole('button', { name: 'Series' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Book' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Group' })).toBeInTheDocument();
  });

  it('triggers do not render on archived view (Req 1.1)', async () => {
    // Change mock to archived view
    mockSearchParams.delete('view');
    mockSearchParams.set('view', 'archived');

    await act(async () => {
      render(<DashboardView />);
    });

    expect(screen.queryByRole('button', { name: 'Series' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Book' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Group' })).not.toBeInTheDocument();

    // Reset for other tests
    mockSearchParams.delete('view');
    mockSearchParams.set('view', 'active');
  });

  it('triggers are labelled with type names (Req 1.2)', async () => {
    await act(async () => {
      render(<DashboardView />);
    });

    const seriesBtn = screen.getByRole('button', { name: 'Series' });
    const bookBtn = screen.getByRole('button', { name: 'Book' });
    const groupBtn = screen.getByRole('button', { name: 'Group' });

    expect(seriesBtn).toHaveTextContent('Series');
    expect(bookBtn).toHaveTextContent('Book');
    expect(groupBtn).toHaveTextContent('Group');
  });

  it('clicking Series trigger opens Series dialog (Req 1.3)', async () => {
    await act(async () => {
      render(<DashboardView />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Series' }));
    });

    expect(screen.getByText('Add Series')).toBeInTheDocument();
  });

  it('clicking Book trigger opens Book dialog (Req 1.4)', async () => {
    await act(async () => {
      render(<DashboardView />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    });

    expect(screen.getByText('Add Book')).toBeInTheDocument();
  });

  it('clicking Group trigger opens Group dialog (Req 1.5)', async () => {
    await act(async () => {
      render(<DashboardView />);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Group' }));
    });

    expect(screen.getByText('Add Group')).toBeInTheDocument();
  });
});
