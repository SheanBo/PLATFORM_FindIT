/**
 * Advanced Matching Algorithms
 * Fuzzy matching, phonetic matching, semantic similarity
 */

/**
 * Levenshtein Distance - Fuzzy string matching
 * Measures difference between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Edit distance (0 = identical, higher = more different)
 */
function levenshteinDistance(a, b) {
  a = (a || '').toLowerCase();
  b = (b || '').toLowerCase();

  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          matrix[j - 1][i - 1] + 1 // substitution
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Fuzzy Match Score (0-100)
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Match score (100 = perfect, 0 = no match)
 */
function fuzzyMatchScore(a, b) {
  if (!a || !b) return 0;

  a = a.toString().toLowerCase();
  b = b.toString().toLowerCase();

  // Exact match
  if (a === b) return 100;

  // Substring match
  if (a.includes(b) || b.includes(a)) return 90;

  // Calculate similarity based on Levenshtein distance
  const maxLen = Math.max(a.length, b.length);
  const distance = levenshteinDistance(a, b);
  const similarity = 1 - (distance / maxLen);

  return Math.round(similarity * 100);
}

/**
 * Soundex - Phonetic matching
 * Encodes strings based on how they sound
 * @param {string} str - Input string
 * @returns {string} Soundex code (e.g., "S530")
 */
function soundex(str) {
  if (!str) return '';

  str = str.toString().toUpperCase();
  const firstLetter = str[0];

  const codes = {
    B: 1, F: 1, P: 1, V: 1,
    C: 2, G: 2, J: 2, K: 2, Q: 2, S: 2, X: 2, Z: 2,
    D: 3, T: 3,
    L: 4,
    M: 5, N: 5,
    R: 6
  };

  let code = firstLetter;
  let lastDigit = codes[firstLetter] || 0;

  for (let i = 1; i < str.length && code.length < 4; i++) {
    const digit = codes[str[i]] || 0;
    if (digit !== 0 && digit !== lastDigit) {
      code += digit;
      lastDigit = digit;
    } else if (digit === 0) {
      lastDigit = 0;
    }
  }

  return (code + '000').substring(0, 4);
}

/**
 * Phonetic Match Score (0-100)
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Phonetic similarity score
 */
function phoneticMatchScore(a, b) {
  if (!a || !b) return 0;

  const soundexA = soundex(a);
  const soundexB = soundex(b);

  return soundexA === soundexB ? 85 : 0;
}

/**
 * TF-IDF Score - Semantic similarity
 * Calculates similarity between two descriptions
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Similarity score (0-100)
 */
function tfidfScore(text1, text2) {
  if (!text1 || !text2) return 0;

  // Tokenize and clean
  const tokens1 = text1.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);

  const tokens2 = text2.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  // Calculate intersection
  const set2 = new Set(tokens2);
  const intersection = tokens1.filter(t => set2.has(t)).length;

  // Jaccard similarity
  const union = new Set([...tokens1, ...tokens2]).size;
  const similarity = intersection / union;

  return Math.round(similarity * 100);
}

/**
 * Temporal Match Score
 * Matches dates within reasonable range
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} Match score (0-100)
 */
function temporalMatchScore(date1, date2) {
  if (!date1 || !date2) return 0;

  const d1 = new Date(date1);
  const d2 = new Date(date2);

  if (isNaN(d1) || isNaN(d2)) return 0;

  // Calculate days difference
  const diffMs = Math.abs(d1 - d2);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Score based on proximity
  if (diffDays === 0) return 100; // Same day
  if (diffDays <= 1) return 95; // Next day
  if (diffDays <= 3) return 85; // Within 3 days
  if (diffDays <= 7) return 70; // Within a week
  if (diffDays <= 30) return 50; // Within a month
  if (diffDays <= 90) return 30; // Within 3 months

  return 0; // Too far apart
}

/**
 * Partial Word Match
 * Matches partial words or abbreviations
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Match score (0-100)
 */
function partialWordMatchScore(a, b) {
  if (!a || !b) return 0;

  a = a.toString().toLowerCase();
  b = b.toString().toLowerCase();

  // Check if first N characters match (for abbreviations)
  const minLen = Math.min(a.length, b.length);
  if (minLen >= 2) {
    const matching = [...a.substring(0, minLen)]
      .filter((char, i) => char === b[i]).length;

    if (matching === minLen) return 80;
  }

  // Check word boundaries
  const wordsA = a.split(/[\s\-_\.]/);
  const wordsB = b.split(/[\s\-_\.]/);

  const matchingWords = wordsA.filter(w =>
    wordsB.some(wb => wb.startsWith(w) || w.startsWith(wb))
  ).length;

  if (matchingWords > 0) {
    return Math.round((matchingWords / Math.max(wordsA.length, wordsB.length)) * 75);
  }

  return 0;
}

/**
 * Comprehensive String Similarity Score
 * Combines multiple matching strategies
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Weighted match score (0-100)
 */
function comprehensiveStringMatch(a, b) {
  if (!a || !b) return 0;

  // Exact match takes priority
  if (a.toLowerCase() === b.toLowerCase()) return 100;

  const scores = {
    fuzzy: fuzzyMatchScore(a, b),
    phonetic: phoneticMatchScore(a, b),
    partial: partialWordMatchScore(a, b)
  };

  // Weighted average (emphasize fuzzy matching)
  const weighted = (
    scores.fuzzy * 0.6 +      // Fuzzy: 60%
    scores.phonetic * 0.2 +   // Phonetic: 20%
    scores.partial * 0.2      // Partial: 20%
  );

  return Math.round(weighted);
}

module.exports = {
  levenshteinDistance,
  fuzzyMatchScore,
  soundex,
  phoneticMatchScore,
  tfidfScore,
  temporalMatchScore,
  partialWordMatchScore,
  comprehensiveStringMatch
};
