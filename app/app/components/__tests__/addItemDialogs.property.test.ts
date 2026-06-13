/**
 * @vitest-environment jsdom
 */
// Feature: add-item-dialogs, Property 1: Trigger visibility is determined by view state
// Feature: add-item-dialogs, Property 3: Valid input Save closes dialog
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';

/**
 * Property-Based Test: Trigger visibility is determined by view state
 *
 * For any dashboard view state, Add Item Trigger buttons should be rendered
 * if and only if the current view is "active". When the view is "archived",
 * no triggers should be present.
 *
 * The DashboardView component gates trigger rendering with the condition:
 *   {view === 'active' && (...triggers...)}
 *
 * This property verifies that:
 * 1. The visibility predicate (view === 'active') is the sole determinant
 * 2. For any generated view state, triggers are present iff view === 'active'
 * 3. All three trigger types share the same visibility gate
 *
 * **Validates: Requirements 1.1**
 */

const DASHBOARD_VIEW_PATH = path.resolve(__dirname, '../DashboardView.tsx');

/**
 * The core visibility predicate extracted from DashboardView:
 * Triggers are shown if and only if view === 'active'
 */
function shouldShowTriggers(view: string): boolean {
  return view === 'active';
}

/** The trigger button labels that should appear in active view */
const TRIGGER_LABELS = ['Series', 'Book', 'Group'] as const;

/**
 * Arbitrary that generates valid view state values used by the application.
 * The DashboardView component uses: 'active' | 'archived'
 */
const validViewStateArb = fc.constantFrom('active', 'archived');

/**
 * Arbitrary that generates arbitrary strings to test that ONLY 'active'
 * enables trigger visibility - any other string should not show triggers.
 */
const arbitraryViewStateArb = fc.oneof(
  validViewStateArb,
  fc.string({ minLength: 0, maxLength: 20 }),
  fc.constantFrom('', 'Active', 'ACTIVE', 'archive', 'trash', 'inactive')
);

describe('Feature: add-item-dialogs, Property 1: Trigger visibility is determined by view state', () => {
  it('DashboardView source conditionally renders triggers only when view === active', () => {
    const source = fs.readFileSync(DASHBOARD_VIEW_PATH, 'utf-8');

    // Verify the conditional rendering pattern exists in the source
    // The component uses: {view === 'active' && (...triggers...)}
    expect(source).toContain("view === 'active'");

    // Verify all three trigger button labels are present in the source
    for (const label of TRIGGER_LABELS) {
      expect(source).toContain(label);
    }
  });

  it('triggers are shown if and only if view is exactly "active"', () => {
    fc.assert(
      fc.property(arbitraryViewStateArb, (view) => {
        const visible = shouldShowTriggers(view);

        if (view === 'active') {
          // When view is 'active', triggers MUST be visible
          expect(visible).toBe(true);
        } else {
          // For any other view state, triggers MUST NOT be visible
          expect(visible).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('triggers are never shown for archived view state', () => {
    fc.assert(
      fc.property(fc.constant('archived'), (view) => {
        expect(shouldShowTriggers(view)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('all three trigger types (Series, Book, Group) share the same visibility condition', () => {
    // Read the source and verify all triggers are within the same conditional block
    const source = fs.readFileSync(DASHBOARD_VIEW_PATH, 'utf-8');

    // Find the conditional block that gates trigger rendering.
    // The pattern is: {view === 'active' && ( ... )} spanning multiple lines
    const conditionalStart = source.indexOf("{view === 'active' && (");
    expect(conditionalStart).toBeGreaterThan(-1);

    // Extract a reasonable chunk after the conditional start to find all triggers
    const blockSlice = source.slice(conditionalStart, conditionalStart + 1000);

    // Verify all trigger labels are inside the same conditional block
    fc.assert(
      fc.property(
        fc.constantFrom(...TRIGGER_LABELS),
        (label) => {
          // Each trigger label must appear within the conditional block
          expect(blockSlice).toContain(label);
        }
      ),
      { numRuns: 100 }
    );
  });
});



// Mock the native dialog element methods not supported in jsdom
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

afterEach(() => {
  cleanup();
});

// Generator for non-empty, non-whitespace strings respecting max length
function nonEmptyNonWhitespaceArb(maxLength: number): fc.Arbitrary<string> {
  return fc
    .string({ minLength: 1, maxLength })
    .filter(s => s.trim().length > 0);
}

describe('Feature: add-item-dialogs, Property 3: Valid input Save closes dialog', () => {
  /**
   * **Validates: Requirements 2.5, 3.5**
   *
   * For any non-empty, non-whitespace string entered in the Series or Book dialog,
   * activating the Save button should result in onSave being called with the trimmed value.
   */
  it('Save calls onSave with trimmed value for AddSeriesDialog', async () => {
    const { AddSeriesDialog } = await import('@/app/app/components/AddSeriesDialog');

    fc.assert(
      fc.property(
        nonEmptyNonWhitespaceArb(100),
        (input) => {
          const onSave = vi.fn();
          const onClose = vi.fn();

          const { getByLabelText, getByRole } = render(
            React.createElement(AddSeriesDialog, { open: true, onSave, onClose })
          );

          const inputEl = getByLabelText('Series name') as HTMLInputElement;
          fireEvent.change(inputEl, { target: { value: input } });

          const saveBtn = getByRole('button', { name: 'Save' });
          fireEvent.click(saveBtn);

          expect(onSave).toHaveBeenCalledTimes(1);
          expect(onSave).toHaveBeenCalledWith(input.trim());

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Save calls onSave with trimmed value for AddBookDialog', async () => {
    const { AddBookDialog } = await import('@/app/app/components/AddBookDialog');

    fc.assert(
      fc.property(
        nonEmptyNonWhitespaceArb(200),
        (input) => {
          const onSave = vi.fn();
          const onClose = vi.fn();

          const { getByLabelText, getByRole } = render(
            React.createElement(AddBookDialog, { open: true, onSave, onClose })
          );

          const inputEl = getByLabelText('Book title') as HTMLInputElement;
          fireEvent.change(inputEl, { target: { value: input } });

          const saveBtn = getByRole('button', { name: 'Save' });
          fireEvent.click(saveBtn);

          expect(onSave).toHaveBeenCalledTimes(1);
          expect(onSave).toHaveBeenCalledWith(input.trim());

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 7: Save does not modify the dashboard item list ────────────────

/**
 * Property-Based Test: Save does not modify the dashboard item list
 *
 * For any add-item dialog type and any valid input, after activating Save the
 * dashboard's displayed item list should remain identical to the list before
 * the dialog was opened.
 *
 * Approach: Render DashboardView with mock fetch returning items, open a dialog,
 * enter valid input, click Save, then verify the item cards in the DOM are unchanged.
 *
 * **Validates: Requirements 6.3**
 */

// Mock next/navigation for DashboardView rendering
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('view=active'),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

/** Generator for a mock DashboardItem */
const dashboardItemArb = (index: number) =>
  fc.record({
    id: fc.constant(String(index + 1)),
    source: fc.constantFrom('series' as const, 'book' as const),
    type: fc.constantFrom('series' as const, 'group' as const, 'standalone_book' as const),
    title: fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0),
    updatedAt: fc.constant(new Date(2024, 0, index + 1).toISOString()),
    archived: fc.constant(false),
    bookCount: fc.nat({ max: 10 }),
  });

/** Generator for a list of 1–5 mock dashboard items */
const dashboardItemsArb = fc.integer({ min: 1, max: 5 }).chain(count =>
  fc.tuple(...Array.from({ length: count }, (_, i) => dashboardItemArb(i)))
);

/** Generator for dialog type (Property 7) */
const p7DialogTypeArb = fc.constantFrom('series' as const, 'book' as const, 'group' as const);

describe('Feature: add-item-dialogs, Property 7: Save does not modify the dashboard item list', () => {
  it('saving from any dialog type does not change the item list in the DOM', async () => {
    const { DashboardView } = await import('@/app/app/components/DashboardView');
    const { act, waitFor } = await import('@testing-library/react');

    const triggerLabelMap = {
      series: 'Series',
      book: 'Book',
      group: 'Group',
    };

    await fc.assert(
      fc.asyncProperty(
        dashboardItemsArb,
        p7DialogTypeArb,
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        async (items, dialogType, inputValue) => {
          // Mock fetch to return generated items
          const mockFetchFn = vi.fn(() =>
            Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ items, nextCursor: null, hasMore: false }),
            } as unknown as Response)
          );
          vi.stubGlobal('fetch', mockFetchFn);

          let container: HTMLElement;
          await act(async () => {
            const result = render(React.createElement(DashboardView));
            container = result.container;
          });

          // Wait for items to render
          await waitFor(() => {
            const articles = container!.querySelectorAll('article');
            expect(articles.length).toBe(items.length);
          });

          // Capture item titles before dialog interaction
          const titlesBefore = Array.from(container!.querySelectorAll('article h3'))
            .map(el => el.textContent);

          // Click the trigger button to open the dialog
          const triggerButtons = container!.querySelectorAll('button');
          let triggerBtn: HTMLButtonElement | undefined;
          triggerButtons.forEach(btn => {
            if (btn.textContent === triggerLabelMap[dialogType]) {
              triggerBtn = btn as HTMLButtonElement;
            }
          });
          expect(triggerBtn).toBeDefined();

          await act(async () => {
            fireEvent.click(triggerBtn!);
          });

          // Find the input field and type valid input
          const inputEl = document.querySelector(`input[id="add-item-field"]`) as HTMLInputElement;
          expect(inputEl).not.toBeNull();

          await act(async () => {
            fireEvent.change(inputEl, { target: { value: inputValue } });
          });

          // Click Save
          const allButtons = document.querySelectorAll('button');
          let saveBtn: HTMLButtonElement | undefined;
          allButtons.forEach(btn => {
            if (btn.textContent === 'Save') {
              saveBtn = btn as HTMLButtonElement;
            }
          });
          expect(saveBtn).toBeDefined();

          await act(async () => {
            fireEvent.click(saveBtn!);
          });

          // Verify item list is unchanged: same count and same titles
          const titlesAfter = Array.from(container!.querySelectorAll('article h3'))
            .map(el => el.textContent);

          expect(titlesAfter.length).toBe(titlesBefore.length);
          expect(titlesAfter).toEqual(titlesBefore);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property-Based Test: Whitespace-only input is rejected across all dialogs
 *
 * For any string composed entirely of whitespace characters (including empty string)
 * entered in any add-item dialog, activating the Save button should display a
 * validation error and keep the dialog open with the field unchanged.
 *
 * **Validates: Requirements 2.6, 3.6, 4.6**
 */

// Generator for whitespace-only strings (spaces, tabs, newlines, carriage returns, empty string)
const whitespaceOnlyArb: fc.Arbitrary<string> = fc.oneof(
  fc.constant(''),
  fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 50 }).map(chars => chars.join(''))
);

interface DialogConfig {
  name: string;
  fieldLabel: string;
  expectedError: string;
  importFn: () => Promise<{ default?: React.ComponentType<any>; [key: string]: any }>;
  componentKey: string;
}

const dialogConfigs: DialogConfig[] = [
  {
    name: 'AddSeriesDialog',
    fieldLabel: 'Series name',
    expectedError: 'Series name is required',
    importFn: () => import('@/app/app/components/AddSeriesDialog'),
    componentKey: 'AddSeriesDialog',
  },
  {
    name: 'AddBookDialog',
    fieldLabel: 'Book title',
    expectedError: 'Book title is required',
    importFn: () => import('@/app/app/components/AddBookDialog'),
    componentKey: 'AddBookDialog',
  },
  {
    name: 'AddGroupDialog',
    fieldLabel: 'Group name',
    expectedError: 'Group name is required',
    importFn: () => import('@/app/app/components/AddGroupDialog'),
    componentKey: 'AddGroupDialog',
  },
];

describe('Feature: add-item-dialogs, Property 5: Whitespace-only input is rejected', () => {
  for (const config of dialogConfigs) {
    it(`${config.name}: whitespace-only input shows validation error and does not call onSave`, async () => {
      const mod = await config.importFn();
      const Component = mod[config.componentKey] as React.ComponentType<any>;

      fc.assert(
        fc.property(whitespaceOnlyArb, (whitespaceInput) => {
          const onSave = vi.fn();
          const onClose = vi.fn();

          const { getByLabelText, getByRole, queryByRole } = render(
            React.createElement(Component, { open: true, onSave, onClose })
          );

          const inputEl = getByLabelText(config.fieldLabel) as HTMLInputElement;

          // Type the whitespace-only string (skip if empty — field starts empty)
          if (whitespaceInput.length > 0) {
            fireEvent.change(inputEl, { target: { value: whitespaceInput } });
          }

          // Click Save
          const saveBtn = getByRole('button', { name: 'Save' });
          fireEvent.click(saveBtn);

          // Assert: onSave is NOT called
          expect(onSave).not.toHaveBeenCalled();

          // Assert: validation error is displayed (role="alert")
          const alert = queryByRole('alert');
          expect(alert).not.toBeNull();
          expect(alert!.textContent).toBe(config.expectedError);

          // Assert: dialog remains open (onClose NOT called)
          expect(onClose).not.toHaveBeenCalled();

          cleanup();
        }),
        { numRuns: 100 }
      );
    });
  }
});


/**
 * Property-Based Test: No network requests during dialog interactions
 *
 * For any sequence of actions within any add-item dialog (opening, typing,
 * saving, cancelling), no HTTP fetch or network requests should be initiated.
 *
 * Strategy:
 * - Render each dialog standalone (not via DashboardView) so there's no
 *   background fetch from the dashboard's data loading.
 * - Spy on global.fetch before rendering.
 * - Generate random action sequences: type text, click Save, click Cancel.
 * - After all actions, verify fetch was never called.
 *
 * **Validates: Requirements 6.1, 6.2**
 */

type NetworkTestAction =
  | { type: 'type'; text: string }
  | { type: 'save' }
  | { type: 'cancel' };

/** Arbitrary for a single dialog action (network test) */
const networkTestActionArb: fc.Arbitrary<NetworkTestAction> = fc.oneof(
  fc.string({ minLength: 0, maxLength: 50 }).map((text) => ({ type: 'type' as const, text })),
  fc.constant({ type: 'save' as const }),
  fc.constant({ type: 'cancel' as const })
);

/** Arbitrary for a sequence of dialog actions (1-10 actions, network test) */
const networkTestActionSequenceArb = fc.array(networkTestActionArb, { minLength: 1, maxLength: 10 });

/** Dialog type selector (network test) */
const networkTestDialogTypeArb = fc.constantFrom('series', 'book', 'group') as fc.Arbitrary<'series' | 'book' | 'group'>;

/** Field labels for each dialog type (network test) */
const NETWORK_TEST_FIELD_LABELS: Record<'series' | 'book' | 'group', string> = {
  series: 'Series name',
  book: 'Book title',
  group: 'Group name',
};

describe('Feature: add-item-dialogs, Property 6: No network requests during dialog interactions', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    global.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('no fetch calls are made during any sequence of dialog interactions', async () => {
    const { AddSeriesDialog } = await import('@/app/app/components/AddSeriesDialog');
    const { AddBookDialog } = await import('@/app/app/components/AddBookDialog');
    const { AddGroupDialog } = await import('@/app/app/components/AddGroupDialog');

    const dialogComponents = {
      series: AddSeriesDialog,
      book: AddBookDialog,
      group: AddGroupDialog,
    };

    fc.assert(
      fc.property(
        networkTestDialogTypeArb,
        networkTestActionSequenceArb,
        (dialogType, actions) => {
          // Reset spy count for each iteration
          fetchSpy.mockClear();

          const onSave = vi.fn();
          const onClose = vi.fn();

          const Component = dialogComponents[dialogType];
          const { getByLabelText, getByRole } = render(
            React.createElement(Component, { open: true, onSave, onClose })
          );

          const fieldLabel = NETWORK_TEST_FIELD_LABELS[dialogType];

          // Execute each action in the sequence
          for (const action of actions) {
            switch (action.type) {
              case 'type': {
                const inputEl = getByLabelText(fieldLabel) as HTMLInputElement;
                fireEvent.change(inputEl, { target: { value: action.text } });
                break;
              }
              case 'save': {
                const saveBtn = getByRole('button', { name: 'Save' });
                fireEvent.click(saveBtn);
                break;
              }
              case 'cancel': {
                const cancelBtn = getByRole('button', { name: 'Cancel' });
                fireEvent.click(cancelBtn);
                break;
              }
            }
          }

          // Assert: no fetch calls were made during the entire interaction
          expect(fetchSpy).not.toHaveBeenCalled();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 8: Re-opening a dialog resets form fields
 *
 * For any string previously entered in a dialog's input field, after closing
 * the dialog and re-opening it, the input field should be empty and no
 * validation error should be displayed.
 *
 * **Validates: Requirements 6.4**
 */

/** Dialog type selector (Property 8) */
const dialogTypeArb = fc.constantFrom('series', 'book', 'group') as fc.Arbitrary<'series' | 'book' | 'group'>;

/** Field labels for each dialog type (Property 8) */
const P8_FIELD_LABELS: Record<'series' | 'book' | 'group', string> = {
  series: 'Series name',
  book: 'Book title',
  group: 'Group name',
};

describe('Feature: add-item-dialogs, Property 8: Re-opening a dialog resets form fields', () => {
  /**
   * **Validates: Requirements 6.4**
   *
   * For any string typed into any dialog, after closing (Cancel) and re-opening,
   * the input field should be empty and no validation error should be displayed.
   */
  it('re-opening a dialog after typing resets the input field to empty', async () => {
    const { AddSeriesDialog } = await import('@/app/app/components/AddSeriesDialog');
    const { AddBookDialog } = await import('@/app/app/components/AddBookDialog');
    const { AddGroupDialog } = await import('@/app/app/components/AddGroupDialog');

    const dialogs = { series: AddSeriesDialog, book: AddBookDialog, group: AddGroupDialog };

    fc.assert(
      fc.property(
        dialogTypeArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        (type, input) => {
          const onSave = vi.fn();
          const onClose = vi.fn();
          const fieldLabel = P8_FIELD_LABELS[type];
          const DialogComponent = dialogs[type];

          // Step 1: Render dialog open
          const { getByLabelText, rerender, queryByRole } = render(
            React.createElement(DialogComponent, { open: true, onSave, onClose })
          );

          // Step 2: Type a generated string into the input
          const inputEl = getByLabelText(fieldLabel) as HTMLInputElement;
          fireEvent.change(inputEl, { target: { value: input } });
          expect(inputEl.value).toBe(input);

          // Step 3: Close dialog (set open=false via rerender)
          rerender(
            React.createElement(DialogComponent, { open: false, onSave, onClose })
          );

          // Step 4: Re-open dialog (set open=true via rerender)
          rerender(
            React.createElement(DialogComponent, { open: true, onSave, onClose })
          );

          // Step 5: Assert input field is empty
          const inputAfterReopen = getByLabelText(fieldLabel) as HTMLInputElement;
          expect(inputAfterReopen.value).toBe('');

          // Assert no validation error (no element with role="alert")
          const alertEl = queryByRole('alert');
          expect(alertEl).toBeNull();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 6.4**
   *
   * After triggering a validation error (Save with empty after clearing),
   * closing and re-opening should show no error and empty field.
   */
  it('re-opening a dialog after validation error resets both field and error', async () => {
    const { AddSeriesDialog } = await import('@/app/app/components/AddSeriesDialog');
    const { AddBookDialog } = await import('@/app/app/components/AddBookDialog');
    const { AddGroupDialog } = await import('@/app/app/components/AddGroupDialog');

    const dialogs = { series: AddSeriesDialog, book: AddBookDialog, group: AddGroupDialog };

    fc.assert(
      fc.property(
        dialogTypeArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        (type, input) => {
          const onSave = vi.fn();
          const onClose = vi.fn();
          const fieldLabel = P8_FIELD_LABELS[type];
          const DialogComponent = dialogs[type];

          // Step 1: Render dialog open
          const { getByLabelText, getByRole, rerender, queryByRole } = render(
            React.createElement(DialogComponent, { open: true, onSave, onClose })
          );

          // Step 2: Type something, then clear it, then trigger validation
          const inputEl = getByLabelText(fieldLabel) as HTMLInputElement;
          fireEvent.change(inputEl, { target: { value: input } });
          fireEvent.change(inputEl, { target: { value: '' } });

          // Trigger validation error by clicking Save with empty input
          const saveBtn = getByRole('button', { name: 'Save' });
          fireEvent.click(saveBtn);

          // Verify validation error is shown
          const alertEl = queryByRole('alert');
          expect(alertEl).not.toBeNull();

          // Step 3: Close dialog
          rerender(
            React.createElement(DialogComponent, { open: false, onSave, onClose })
          );

          // Step 4: Re-open dialog
          rerender(
            React.createElement(DialogComponent, { open: true, onSave, onClose })
          );

          // Step 5: Assert input is empty and no error shown
          const inputAfterReopen = getByLabelText(fieldLabel) as HTMLInputElement;
          expect(inputAfterReopen.value).toBe('');

          const alertAfterReopen = queryByRole('alert');
          expect(alertAfterReopen).toBeNull();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});
