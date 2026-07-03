const { createTestItem, createTestReport } = require('../helpers');
const { scoreMatch, MATCH_THRESHOLD } = require('../../modules/matching/score');

describe('Matching Algorithm (scoreMatch)', () => {
  test('should calculate perfect match (100 points)', () => {
    const item = createTestItem({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Brand: 'Coach',
      Item_Size: 'Medium',
      Location_ID: 1
    });

    const report = createTestReport({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Brand: 'Coach',
      Item_Size: 'Medium',
      Location_ID: 1
    });

    const { score, breakdown } = scoreMatch(item, report);
    expect(score).toBe(100);
    expect(breakdown).toEqual({ category: 20, color: 15, brand: 30, size: 20, location: 15 });
  });

  test('should not match with category difference', () => {
    const item = createTestItem({ Category_ID: 1 });
    const report = createTestReport({ Category_ID: 2 });

    const { breakdown } = scoreMatch(item, report);
    expect(breakdown.category).toBe(0);
  });

  test('should match category + color only (35 points - coincidental overlap stays well below threshold)', () => {
    // Null out the other optional fields and differ the location so only
    // category (20) + color (15) contribute. These are the two most
    // common/low-cardinality attributes, so overlapping on them alone
    // must not read as a strong match.
    const item = createTestItem({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Brand: null,
      Item_Size: null,
      Location_ID: 1
    });

    const report = createTestReport({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Brand: null,
      Item_Size: null,
      Location_ID: 2
    });

    const { score } = scoreMatch(item, report);
    expect(score).toBe(35);
    expect(score).toBeLessThan(MATCH_THRESHOLD);
  });

  test('should match category + color + brand (65 points - still below threshold without size or location)', () => {
    const item = createTestItem({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Brand: 'Coach',
      Item_Size: null,
      Location_ID: 1
    });

    const report = createTestReport({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Brand: 'Coach',
      Item_Size: null,
      Location_ID: 2
    });

    const { score } = scoreMatch(item, report);
    expect(score).toBe(65);
    expect(score).toBeLessThan(MATCH_THRESHOLD);
  });

  test('should match category + color + brand + location (80 points - at the threshold)', () => {
    // 80 is the lowest achievable score at or above the new threshold, and
    // it requires brand (the most distinctive attribute) to be part of it.
    const item = createTestItem({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Brand: 'Coach',
      Item_Size: null,
      Location_ID: 1
    });

    const report = createTestReport({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Brand: 'Coach',
      Item_Size: null,
      Location_ID: 1
    });

    const { score } = scoreMatch(item, report);
    expect(score).toBe(80);
    expect(score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });

  test('should not reach threshold without brand, even with category + color + size + location', () => {
    // Confirms brand is the load-bearing attribute: all the "common"
    // fields matching isn't enough on its own.
    const item = createTestItem({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Size: 'Medium',
      Item_Brand: null,
      Location_ID: 1
    });

    const report = createTestReport({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Size: 'Medium',
      Item_Brand: null,
      Location_ID: 1
    });

    const { score } = scoreMatch(item, report);
    expect(score).toBe(70);
    expect(score).toBeLessThan(MATCH_THRESHOLD);
  });

  test('threshold is 80', () => {
    expect(MATCH_THRESHOLD).toBe(80);
  });

  test('should be case-insensitive for color, brand, and size matching', () => {
    const item = createTestItem({ Item_Color: 'BLACK', Item_Brand: 'COACH', Item_Size: 'MEDIUM' });
    const report = createTestReport({ Item_Color: 'black', Item_Brand: 'coach', Item_Size: 'medium' });

    const { breakdown } = scoreMatch(item, report);
    expect(breakdown.color).toBe(15);
    expect(breakdown.brand).toBe(30);
    expect(breakdown.size).toBe(20);
  });

  test('should award no points when a field is null on either side', () => {
    const item = createTestItem({
      Category_ID: 1,
      Item_Color: null,
      Item_Brand: 'Coach',
      Item_Size: null,
      Location_ID: 1
    });

    const report = createTestReport({
      Category_ID: 2,
      Item_Color: 'Black',
      Item_Brand: null,
      Item_Size: null,
      Location_ID: 2
    });

    const { score, breakdown } = scoreMatch(item, report);
    expect(score).toBe(0);
    expect(breakdown).toEqual({ category: 0, color: 0, brand: 0, size: 0, location: 0 });
  });

  test('should award no points for empty-string fields', () => {
    const item = createTestItem({
      Category_ID: 1,
      Item_Color: '',
      Item_Brand: '',
      Item_Size: '',
      Location_ID: 2
    });

    const report = createTestReport({
      Category_ID: 3,
      Item_Color: '',
      Item_Brand: '',
      Item_Size: '',
      Location_ID: 4
    });

    const { score } = scoreMatch(item, report);
    expect(score).toBe(0);
  });

  test('should handle missing optional fields without throwing', () => {
    const item = createTestItem({
      Category_ID: 1,
      Item_Size: null,
      Item_Brand: null
    });

    const report = createTestReport({
      Category_ID: 1,
      Item_Size: null,
      Item_Brand: null
    });

    const { score } = scoreMatch(item, report);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
