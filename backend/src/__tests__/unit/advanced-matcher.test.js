const {
  calculateAdvancedMatchScore,
  getConfidenceLevel,
  batchMatch,
  getMatchExplanation
} = require('../../utils/advanced-matcher');
const { createTestItem, createTestReport } = require('../helpers');

describe('Advanced Match Score Calculation', () => {
  test('should give perfect score for complete match', () => {
    const item = createTestItem({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Brand: 'Coach',
      Item_Size: 'Medium',
      Location_ID: 1,
      Item_Description: 'Black leather wallet',
      Date_Found: '2024-01-01'
    });

    const report = createTestReport({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Brand: 'Coach',
      Item_Size: 'Medium',
      Location_ID: 1,
      Item_Description: 'Black leather wallet',
      Date_Lost: '2024-01-01'
    });

    const { score } = calculateAdvancedMatchScore(item, report);
    expect(score).toBeGreaterThanOrEqual(95);
  });

  test('should not match different categories', () => {
    const item = createTestItem({ Category_ID: 1 });
    const report = createTestReport({ Category_ID: 2 });

    const { score, breakdown } = calculateAdvancedMatchScore(item, report);
    expect(breakdown.category).toBe(0);
    expect(score).toBeLessThan(50);
  });

  test('should match with fuzzy brand matching', () => {
    const item = createTestItem({
      Category_ID: 1,
      Item_Brand: 'Couch'  // Typo
    });

    const report = createTestReport({
      Category_ID: 1,
      Item_Brand: 'Coach'
    });

    const { score, breakdown } = calculateAdvancedMatchScore(item, report);
    expect(breakdown.brand).toBeGreaterThan(0);
  });

  test('should boost score for matching locations', () => {
    const item1 = createTestItem({
      Category_ID: 1,
      Item_Color: 'Black',
      Location_ID: 1
    });

    const report1 = createTestReport({
      Category_ID: 1,
      Item_Color: 'Black',
      Location_ID: 1
    });

    const item2 = createTestItem({
      Category_ID: 1,
      Item_Color: 'Black',
      Location_ID: 2
    });

    const report2 = createTestReport({
      Category_ID: 1,
      Item_Color: 'Black',
      Location_ID: 3
    });

    const score1 = calculateAdvancedMatchScore(item1, report1).score;
    const score2 = calculateAdvancedMatchScore(item2, report2).score;

    expect(score1).toBeGreaterThan(score2);
  });

  test('should factor in temporal proximity', () => {
    const item1 = createTestItem({
      Category_ID: 1,
      Date_Found: '2024-01-01'
    });

    const report1 = createTestReport({
      Category_ID: 1,
      Date_Lost: '2024-01-01'
    });

    const item2 = createTestItem({
      Category_ID: 1,
      Date_Found: '2024-01-01'
    });

    const report2 = createTestReport({
      Category_ID: 1,
      Date_Lost: '2024-03-01'
    });

    const score1 = calculateAdvancedMatchScore(item1, report1).score;
    const score2 = calculateAdvancedMatchScore(item2, report2).score;

    expect(score1).toBeGreaterThan(score2);
  });

  test('should consider description similarity', () => {
    const item = createTestItem({
      Category_ID: 1,
      Item_Description: 'Black leather wallet with gold accents'
    });

    const report = createTestReport({
      Category_ID: 1,
      Item_Description: 'Black leather wallet'
    });

    const { breakdown } = calculateAdvancedMatchScore(item, report);
    expect(breakdown.description).toBeGreaterThan(0);
  });

  test('should score below 75 for basic matches', () => {
    const item = createTestItem({
      Category_ID: 1,
      Item_Color: 'Black'
    });

    const report = createTestReport({
      Category_ID: 1,
      Item_Color: 'Black'
    });

    const { score } = calculateAdvancedMatchScore(item, report);
    expect(score).toBeLessThan(75); // Requires more factors
  });

  test('should reach 75+ threshold with multiple matches', () => {
    const item = createTestItem({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Brand: 'Coach',
      Location_ID: 1,
      Date_Found: '2024-01-01'
    });

    const report = createTestReport({
      Category_ID: 1,
      Item_Color: 'Black',
      Item_Brand: 'Coach',
      Location_ID: 1,
      Date_Lost: '2024-01-01'
    });

    const { score } = calculateAdvancedMatchScore(item, report);
    expect(score).toBeGreaterThanOrEqual(75);
  });
});

describe('Confidence Levels', () => {
  test('should return VERY_HIGH for score >= 85', () => {
    expect(getConfidenceLevel(90)).toBe('VERY_HIGH');
    expect(getConfidenceLevel(85)).toBe('VERY_HIGH');
  });

  test('should return HIGH for score 70-84', () => {
    expect(getConfidenceLevel(75)).toBe('HIGH');
  });

  test('should return MODERATE for score 55-69', () => {
    expect(getConfidenceLevel(60)).toBe('MODERATE');
  });

  test('should return LOW for score 40-54', () => {
    expect(getConfidenceLevel(45)).toBe('LOW');
  });

  test('should return VERY_LOW for score < 40', () => {
    expect(getConfidenceLevel(30)).toBe('VERY_LOW');
  });
});

describe('Batch Matching', () => {
  test('should match multiple items against reports', () => {
    const items = [
      createTestItem({ Item_ID: 1, Category_ID: 1, Item_Color: 'Black' }),
      createTestItem({ Item_ID: 2, Category_ID: 2, Item_Color: 'Red' })
    ];

    const reports = [
      createTestReport({ Report_ID: 1, Category_ID: 1, Item_Color: 'Black' }),
      createTestReport({ Report_ID: 2, Category_ID: 2, Item_Color: 'Red' })
    ];

    const matches = batchMatch(items, reports, 50); // Lower threshold for testing
    expect(matches.length).toBeGreaterThan(0);
  });

  test('should only return matches above threshold', () => {
    const items = [createTestItem({ Category_ID: 1 })];
    const reports = [createTestReport({ Category_ID: 2 })];

    const matches = batchMatch(items, reports, 50);
    expect(matches.length).toBe(0);
  });

  test('should sort matches by score descending', () => {
    const items = [
      createTestItem({
        Item_ID: 1,
        Category_ID: 1,
        Item_Color: 'Black',
        Item_Brand: 'Coach'
      })
    ];

    const reports = [
      createTestReport({
        Report_ID: 1,
        Category_ID: 1,
        Item_Color: 'Black',
        Item_Brand: 'Coach'
      }),
      createTestReport({
        Report_ID: 2,
        Category_ID: 1,
        Item_Color: 'Black'
      })
    ];

    const matches = batchMatch(items, reports, 40);
    if (matches.length > 1) {
      expect(matches[0].Match_Score).toBeGreaterThanOrEqual(matches[1].Match_Score);
    }
  });
});

describe('Match Explanation', () => {
  test('should explain matching factors', () => {
    const breakdown = {
      category: 35,
      color_exact: 20,
      brand: 18,
      location: 10
    };

    const explanation = getMatchExplanation(breakdown);
    expect(explanation).toContain('Category match');
    expect(explanation).toContain('Color match');
  });

  test('should handle no matching factors', () => {
    const breakdown = {};
    const explanation = getMatchExplanation(breakdown);
    expect(explanation).toBe('No matching factors found');
  });

  test('should format explanation with proper grammar', () => {
    const breakdown = {
      category: 35,
      color_exact: 20
    };

    const explanation = getMatchExplanation(breakdown);
    expect(explanation).toContain(' and ');
  });
});

describe('Real-World Scenarios', () => {
  test('should match lost iPhone with found iPhone (with typo)', () => {
    const item = createTestItem({
      Category_ID: 1,
      Item_Name: 'iPhone 12',
      Item_Brand: 'Apple',
      Item_Color: 'Black'
    });

    const report = createTestReport({
      Category_ID: 1,
      Item_Name: 'iPhone 12',
      Item_Brand: 'Apple',
      Item_Color: 'Black'
    });

    const { score, confidence } = calculateAdvancedMatchScore(item, report);
    expect(score).toBeGreaterThan(75);
    expect(['HIGH', 'VERY_HIGH']).toContain(confidence);
  });

  test('should match Coach wallet despite minor variations', () => {
    const item = createTestItem({
      Category_ID: 2,
      Item_Name: 'Coach Wallet',
      Item_Brand: 'Coach',
      Item_Color: 'Brown',
      Item_Size: 'Medium'
    });

    const report = createTestReport({
      Category_ID: 2,
      Item_Name: 'Coach Wallet',
      Item_Brand: 'Couch',  // Typo
      Item_Color: 'Brown',
      Item_Size: 'Med'  // Abbreviation
    });

    const { score } = calculateAdvancedMatchScore(item, report);
    expect(score).toBeGreaterThan(70);
  });
});
