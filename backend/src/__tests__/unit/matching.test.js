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
    expect(breakdown).toEqual({ category: 30, color: 20, brand: 20, size: 15, location: 15 });
  });

  test('should not match with category difference', () => {
    const item = createTestItem({ Category_ID: 1 });
    const report = createTestReport({ Category_ID: 2 });

    const { breakdown } = scoreMatch(item, report);
    expect(breakdown.category).toBe(0);
  });

  test('should match category + color (50 points - below 75 threshold)', () => {
    // Null out the other optional fields and differ the location so only
    // category (30) + color (20) contribute.
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
    expect(score).toBe(50); // Not enough for automatic match
    expect(score).toBeLessThan(MATCH_THRESHOLD);
  });

  test('should match category + color + brand (70 points - just below threshold)', () => {
    // 70 is the highest achievable score below the threshold; a score of
    // exactly 75 is impossible with weights {30,20,20,15,15}.
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
    expect(score).toBe(70);
    expect(score).toBeLessThan(MATCH_THRESHOLD);
  });

  test('should match category + color + size + location (80 points - above 75 threshold)', () => {
    // 80 is the lowest achievable score at or above the threshold.
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
    expect(score).toBe(80);
    expect(score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });

  test('threshold is 75', () => {
    expect(MATCH_THRESHOLD).toBe(75);
  });

  test('should be case-insensitive for color, brand, and size matching', () => {
    const item = createTestItem({ Item_Color: 'BLACK', Item_Brand: 'COACH', Item_Size: 'MEDIUM' });
    const report = createTestReport({ Item_Color: 'black', Item_Brand: 'coach', Item_Size: 'medium' });

    const { breakdown } = scoreMatch(item, report);
    expect(breakdown.color).toBe(20);
    expect(breakdown.brand).toBe(20);
    expect(breakdown.size).toBe(15);
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
