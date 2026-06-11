import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { CRAFT_AUDIT_CATEGORIES } from '../craftAuditData';

describe('craftAuditData - category data integrity', () => {
  describe('category count and order', () => {
    it('exports exactly 5 categories', () => {
      expect(CRAFT_AUDIT_CATEGORIES).toHaveLength(5);
    });

    it('categories are in the correct order', () => {
      const expectedOrder = [
        'Setup & Payoff',
        'Character & Theme',
        'Structure & Pacing',
        'Reader Engagement & Psychology',
        'Series-Level Craft Audits',
      ];
      const actualOrder = CRAFT_AUDIT_CATEGORIES.map((c) => c.name);
      expect(actualOrder).toEqual(expectedOrder);
    });
  });

  describe('item counts per category', () => {
    const expectedCounts = [4, 3, 4, 4, 3];

    it.each([
      [0, 'Setup & Payoff', 4],
      [1, 'Character & Theme', 4],
      [2, 'Structure & Pacing', 4],
      [3, 'Reader Engagement & Psychology', 3],
      [4, 'Series-Level Craft Audits', 3],
    ])('category %i "%s" has %i items', (index, _name, count) => {
      expect(CRAFT_AUDIT_CATEGORIES[index].items).toHaveLength(count);
    });
  });

  describe('item names per category (Requirements 2.4–2.8)', () => {
    it('"Setup & Payoff" has correct item names', () => {
      const items = CRAFT_AUDIT_CATEGORIES[0].items.map((i) => i.name);
      expect(items).toEqual([
        "Chekhov's Gun Audit",
        'Red Herring vs. Abandoned Thread Audit',
        'Foreshadowing Density & Twist Fairness Audit',
        'MacGuffin Clarity Audit',
      ]);
    });

    it('"Character & Theme" has correct item names', () => {
      const items = CRAFT_AUDIT_CATEGORIES[1].items.map((i) => i.name);
      expect(items).toEqual([
        'Want vs. Need Audit',
        'Thematic Throughline Audit',
        'Mirror/Foil Character Audit',
        'Point-of-View Discipline Audit',
      ]);
    });

    it('"Structure & Pacing" has correct item names', () => {
      const items = CRAFT_AUDIT_CATEGORIES[2].items.map((i) => i.name);
      expect(items).toEqual([
        'Story Beat Placement Audit',
        'Scene/Sequel (Action/Reaction) Balance Audit',
        'Show vs. Tell at Key Moments Audit',
        'Timeline Juxtaposition / Flashback Audit',
      ]);
    });

    it('"Reader Engagement & Psychology" has correct item names', () => {
      const items = CRAFT_AUDIT_CATEGORIES[3].items.map((i) => i.name);
      expect(items).toEqual([
        'Zeigarnik Effect / Open Loop Audit',
        'Dramatic Irony Audit',
        'Stakes Escalation Audit',
      ]);
    });

    it('"Series-Level Craft Audits" has correct item names', () => {
      const items = CRAFT_AUDIT_CATEGORIES[4].items.map((i) => i.name);
      expect(items).toEqual([
        'Cross-Book Setup/Payoff Audit',
        'Series Pacing Comparator',
        'Recurring Motif/Theme Tracker (Series)',
      ]);
    });
  });

  describe('data file has no React/component imports (Requirements 6.1, 6.2)', () => {
    it('does not import from react or any component module', () => {
      const filePath = resolve(__dirname, '..', 'craftAuditData.ts');
      const content = readFileSync(filePath, 'utf-8');

      // Check for React imports
      expect(content).not.toMatch(/import\s+.*['"]react['"]/i);
      // Check for component imports (any path containing "component")
      expect(content).not.toMatch(/import\s+.*['"].*component.*['"]/i);
    });
  });
});
