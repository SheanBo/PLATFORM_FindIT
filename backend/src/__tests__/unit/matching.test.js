const { createTestItem, createTestReport } = require('../helpers');

// Mock matching score calculation function
function calculateMatchScore(item, report) {
  let score = 0;
  const breakdown = {};

  // Category (30 points)
  if (item.Category_ID === report.Category_ID) {
    score += 30;
    breakdown.category = 30;
  } else {
    breakdown.category = 0;
  }

  // Color (20 points)
  if (
    item.Item_Color &&
    report.Item_Color &&
    item.Item_Color.toLowerCase() === report.Item_Color.toLowerCase()
  ) {
    score += 20;
    breakdown.color = 20;
  } else {
    breakdown.color = 0;
  }

  // Brand (20 points)
  if (
    item.Item_Brand &&
    report.Item_Brand &&
    item.Item_Brand.toLowerCase() === report.Item_Brand.toLowerCase()
  ) {
    score += 20;
    breakdown.brand = 20;
  } else {
    breakdown.brand = 0;
  }

  // Size (15 points)
  if (
    item.Item_Size &&
    report.Item_Size &&
    item.Item_Size.toLowerCase() === report.Item_Size.toLowerCase()
  ) {
    score += 15;
    breakdown.size = 15;
  } else {
    breakdown.size = 0;
  }

  // Location (15 points)
  if (item.Location_ID === report.Location_ID) {
    score += 15;
    breakdown.location = 15;
  } else {
    breakdown.location = 0;
  }

  return { score, breakdown };
}

describe('Matching Algorithm', () => {
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

    const { score } = calculateMatchScore(item, report);
    expect(score).toBe(100);
  });

  test('should not match with category difference', () => {
    const item = createTestItem({ Category_ID: 1 });
    const report = createTestReport({ Category_ID: 2 });

    const { score, breakdown } = calculateMatchScore(item, report);
    expect(breakdown.category).toBe(0);
  });

  test('should match category + color (50 points - below 75 threshold)', () => {
    const item = createTestItem({
      Category_ID: 1,
      Item_Color: 'Black'
    });

    const report = createTestReport({
      Category_ID: 1,
      Item_Color: 'Black'
    });

    const { score } = calculateMatchScore(item, report);
    expect(score).toBe(50); // Not enough for automatic match
  });

  test('should match category + color + size (65 points - below 75 threshold)', () => {
    const item = createTestItem({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Size: 'Medium'
    });

    const report = createTestReport({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Size: 'Medium'
    });

    const { score } = calculateMatchScore(item, report);
    expect(score).toBe(65); // Still not enough
  });

  test('should match category + color + size + location (80 points - above 75 threshold)', () => {
    const item = createTestItem({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Size: 'Medium',
      Location_ID: 1
    });

    const report = createTestReport({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Size: 'Medium',
      Location_ID: 1
    });

    const { score } = calculateMatchScore(item, report);
    expect(score).toBe(80); // Above 75 threshold
  });

  test('should be case-insensitive for color matching', () => {
    const item = createTestItem({ Item_Color: 'BLACK' });
    const report = createTestReport({ Item_Color: 'black' });

    const { breakdown } = calculateMatchScore(item, report);
    expect(breakdown.color).toBe(20);
  });

  test('should handle missing optional fields', () => {
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

    const { score } = calculateMatchScore(item, report);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
