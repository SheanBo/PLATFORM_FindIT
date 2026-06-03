const {
  levenshteinDistance,
  fuzzyMatchScore,
  soundex,
  phoneticMatchScore,
  tfidfScore,
  temporalMatchScore,
  partialWordMatchScore,
  comprehensiveStringMatch
} = require('../../utils/matching-algorithms');

describe('Levenshtein Distance', () => {
  test('should return 0 for identical strings', () => {
    expect(levenshteinDistance('apple', 'apple')).toBe(0);
  });

  test('should handle case-insensitive comparison', () => {
    expect(levenshteinDistance('Apple', 'apple')).toBe(0);
  });

  test('should calculate distance for similar strings', () => {
    const distance = levenshteinDistance('wallet', 'wallets');
    expect(distance).toBe(1); // One insertion
  });

  test('should handle completely different strings', () => {
    const distance = levenshteinDistance('abc', 'xyz');
    expect(distance).toBeGreaterThan(2);
  });
});

describe('Fuzzy Match Score', () => {
  test('should give 100 for exact match', () => {
    expect(fuzzyMatchScore('wallet', 'wallet')).toBe(100);
  });

  test('should give 90+ for substring match', () => {
    expect(fuzzyMatchScore('leather wallet', 'wallet')).toBeGreaterThanOrEqual(90);
  });

  test('should handle typos', () => {
    const score = fuzzyMatchScore('wallet', 'walet');
    expect(score).toBeGreaterThan(70);
  });

  test('should handle case-insensitivity', () => {
    expect(fuzzyMatchScore('WALLET', 'wallet')).toBe(100);
  });

  test('should return 0 for null/empty strings', () => {
    expect(fuzzyMatchScore('', 'wallet')).toBe(0);
    expect(fuzzyMatchScore(null, 'wallet')).toBe(0);
  });
});

describe('Soundex - Phonetic Matching', () => {
  test('should match similar sounding names', () => {
    const soundexSmith = soundex('Smith');
    const soundexSmythe = soundex('Smythe');
    expect(soundexSmith).toBe(soundexSmythe);
  });

  test('should differentiate different sounding names', () => {
    expect(soundex('Smith')).not.toBe(soundex('Johnson'));
  });

  test('should return 4-character code', () => {
    expect(soundex('Apple').length).toBe(4);
  });

  test('should start with first letter', () => {
    expect(soundex('Apple')[0]).toBe('A');
    expect(soundex('Walnut')[0]).toBe('W');
  });
});

describe('Phonetic Match Score', () => {
  test('should give 85 for phonetically similar names', () => {
    expect(phoneticMatchScore('Smith', 'Smythe')).toBe(85);
  });

  test('should give 0 for phonetically different names', () => {
    expect(phoneticMatchScore('Smith', 'Johnson')).toBe(0);
  });

  test('should handle case-insensitivity', () => {
    expect(phoneticMatchScore('SMITH', 'smith')).toBe(85);
  });
});

describe('TF-IDF Score - Description Similarity', () => {
  test('should match identical descriptions', () => {
    const score = tfidfScore('Red leather wallet', 'Red leather wallet');
    expect(score).toBe(100);
  });

  test('should match similar descriptions', () => {
    const score = tfidfScore('Red leather wallet with gold accents', 'Red leather wallet');
    expect(score).toBeGreaterThan(50);
  });

  test('should give low score for different descriptions', () => {
    const score = tfidfScore('Red leather wallet', 'Blue metal keys');
    expect(score).toBeLessThan(30);
  });

  test('should ignore common short words', () => {
    const score = tfidfScore('a red wallet', 'the red wallet');
    expect(score).toBeGreaterThan(70);
  });

  test('should handle empty strings', () => {
    expect(tfidfScore('', 'wallet')).toBe(0);
    expect(tfidfScore('wallet', '')).toBe(0);
  });
});

describe('Temporal Match Score - Date Matching', () => {
  test('should give 100 for same day', () => {
    const date = new Date();
    expect(temporalMatchScore(date, date)).toBe(100);
  });

  test('should give 95 for next day', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-02');
    expect(temporalMatchScore(date1, date2)).toBe(95);
  });

  test('should give 85 for within 3 days', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-03');
    expect(temporalMatchScore(date1, date2)).toBe(85);
  });

  test('should give 70 for within a week', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-07');
    expect(temporalMatchScore(date1, date2)).toBe(70);
  });

  test('should give 50 for within a month', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-30');
    expect(temporalMatchScore(date1, date2)).toBe(50);
  });

  test('should give 0 for dates too far apart', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-05-01');
    expect(temporalMatchScore(date1, date2)).toBe(0);
  });

  test('should handle invalid dates', () => {
    expect(temporalMatchScore('invalid', 'date')).toBe(0);
  });
});

describe('Partial Word Match', () => {
  test('should match abbreviations', () => {
    const score = partialWordMatchScore('iPhone', 'iP');
    expect(score).toBeGreaterThan(70);
  });

  test('should match words with different separators', () => {
    const score = partialWordMatchScore('Coach bag', 'Coach-bag');
    expect(score).toBeGreaterThan(70);
  });

  test('should match partial words', () => {
    const score = partialWordMatchScore('wallet', 'wall');
    expect(score).toBeGreaterThan(60);
  });

  test('should give low score for unrelated words', () => {
    const score = partialWordMatchScore('apple', 'banana');
    expect(score).toBe(0);
  });
});

describe('Comprehensive String Match', () => {
  test('should give 100 for exact match', () => {
    expect(comprehensiveStringMatch('wallet', 'wallet')).toBe(100);
  });

  test('should handle typos with fuzzy matching', () => {
    const score = comprehensiveStringMatch('wallet', 'walet');
    expect(score).toBeGreaterThan(70);
  });

  test('should handle phonetic similarities', () => {
    const score = comprehensiveStringMatch('Smith', 'Smythe');
    expect(score).toBeGreaterThan(50);
  });

  test('should combine multiple strategies', () => {
    // Should use fuzzy (high), phonetic (medium), partial (medium)
    const score = comprehensiveStringMatch('iPhone 12', 'iPhone12');
    expect(score).toBeGreaterThan(80);
  });

  test('should prioritize exact and fuzzy matches', () => {
    // Fuzzy should be weighted at 60%
    const score = comprehensiveStringMatch('leather', 'leathers');
    expect(score).toBeGreaterThan(comprehensiveStringMatch('leather', 'Smith'));
  });
});

describe('Real-World Matching Scenarios', () => {
  test('should match similar item names despite typos', () => {
    const score = comprehensiveStringMatch('Apple AirPods', 'Apple AirPod');
    expect(score).toBeGreaterThan(80);
  });

  test('should match Coach brand variations', () => {
    const score = comprehensiveStringMatch('Coach Wallet', 'Coach');
    expect(score).toBeGreaterThan(85);
  });

  test('should match color variations', () => {
    const score = comprehensiveStringMatch('Black', 'Blck');
    expect(score).toBeGreaterThan(70);
  });

  test('should match descriptions with common variations', () => {
    const desc1 = 'Black leather wallet with multiple card slots';
    const desc2 = 'Black leather wallet with card slots';
    const score = tfidfScore(desc1, desc2);
    expect(score).toBeGreaterThan(70);
  });
});
