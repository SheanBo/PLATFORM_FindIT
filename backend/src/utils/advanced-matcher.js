/**
 * Advanced Matching Engine
 * Combines multiple matching strategies for intelligent item-report matching
 */

const {
  fuzzyMatchScore,
  phoneticMatchScore,
  tfidfScore,
  temporalMatchScore,
  partialWordMatchScore,
  comprehensiveStringMatch
} = require('./matching-algorithms');

/**
 * Calculate comprehensive match score
 * @param {Object} item - Found item
 * @param {Object} report - Lost report
 * @returns {Object} { score: 0-100, breakdown: {...} }
 */
function calculateAdvancedMatchScore(item, report) {
  const breakdown = {};
  let totalScore = 0;

  // ===== CRITICAL FACTORS (Category & Date) =====
  // Category match - most important
  if (item.Category_ID === report.Category_ID) {
    breakdown.category = 35;
    totalScore += 35;
  } else {
    breakdown.category = 0;
  }

  // Temporal matching - importance increases if recent
  const dateScore = temporalMatchScore(item.Date_Found, report.Date_Lost);
  breakdown.temporal = Math.round(dateScore * 0.15); // 15 points max
  totalScore += breakdown.temporal;

  // ===== PRIMARY ATTRIBUTES (Color, Brand) =====
  // Exact color match
  if (item.Item_Color && report.Item_Color) {
    const colorExact = item.Item_Color.toLowerCase() === report.Item_Color.toLowerCase();
    if (colorExact) {
      breakdown.color_exact = 20;
      totalScore += 20;
    } else {
      // Fuzzy color matching
      const colorFuzzy = comprehensiveStringMatch(item.Item_Color, report.Item_Color);
      breakdown.color_fuzzy = Math.round((colorFuzzy / 100) * 12); // Up to 12 points
      totalScore += breakdown.color_fuzzy;
    }
  } else {
    breakdown.color_exact = 0;
    breakdown.color_fuzzy = 0;
  }

  // Brand matching
  if (item.Item_Brand && report.Item_Brand) {
    const brandMatch = comprehensiveStringMatch(item.Item_Brand, report.Item_Brand);
    breakdown.brand = Math.round((brandMatch / 100) * 18); // Up to 18 points
    totalScore += breakdown.brand;
  } else {
    breakdown.brand = 0;
  }

  // ===== SECONDARY ATTRIBUTES (Size, Location) =====
  // Size matching
  if (item.Item_Size && report.Item_Size) {
    const sizeMatch = comprehensiveStringMatch(item.Item_Size, report.Item_Size);
    breakdown.size = Math.round((sizeMatch / 100) * 12); // Up to 12 points
    totalScore += breakdown.size;
  } else {
    breakdown.size = 0;
  }

  // Location matching
  if (item.Location_ID === report.Location_ID) {
    breakdown.location = 10;
    totalScore += 10;
  } else {
    breakdown.location = 0;
  }

  // ===== SEMANTIC MATCHING (Description) =====
  // Description similarity
  if (item.Item_Description && report.Item_Description) {
    const descSimilarity = tfidfScore(item.Item_Description, report.Item_Description);
    breakdown.description = Math.round((descSimilarity / 100) * 8); // Up to 8 points
    totalScore += breakdown.description;
  } else {
    breakdown.description = 0;
  }

  // ===== BONUS FACTORS =====
  // Matching found and lost locations (different from exact location match)
  // This factors in geographic proximity importance
  let bonusBoost = 0;
  if (item.Location_ID === report.Location_ID && item.Category_ID === report.Category_ID) {
    // Both location and category match - high confidence
    bonusBoost = 2;
  }

  totalScore += bonusBoost;
  breakdown.bonus = bonusBoost;

  // Cap score at 100
  totalScore = Math.min(totalScore, 100);

  return {
    score: totalScore,
    breakdown,
    confidence: getConfidenceLevel(totalScore)
  };
}

/**
 * Get confidence level based on score
 * @param {number} score - Match score (0-100)
 * @returns {string} Confidence level
 */
function getConfidenceLevel(score) {
  if (score >= 85) return 'VERY_HIGH';
  if (score >= 70) return 'HIGH';
  if (score >= 55) return 'MODERATE';
  if (score >= 40) return 'LOW';
  return 'VERY_LOW';
}

/**
 * Batch match items against reports
 * @param {Array} items - Array of found items
 * @param {Array} reports - Array of lost reports
 * @param {number} threshold - Minimum match score (default: 75)
 * @returns {Array} Array of matches
 */
function batchMatch(items, reports, threshold = 75) {
  const matches = [];

  for (const item of items) {
    for (const report of reports) {
      const { score, breakdown, confidence } = calculateAdvancedMatchScore(item, report);

      if (score >= threshold) {
        matches.push({
          Item_ID: item.Item_ID,
          Report_ID: report.Report_ID,
          Match_Score: score,
          Score_Breakdown: breakdown,
          Confidence: confidence,
          Match_Type: 'Advanced'
        });
      }
    }
  }

  // Sort by score descending
  return matches.sort((a, b) => b.Match_Score - a.Match_Score);
}

/**
 * Get match explanation for display
 * @param {Object} breakdown - Score breakdown
 * @returns {string} Human-readable explanation
 */
function getMatchExplanation(breakdown) {
  const factors = [];

  if (breakdown.category > 0) factors.push('Category match');
  if (breakdown.color_exact > 0) factors.push('Color match');
  if (breakdown.color_fuzzy > 0) factors.push('Similar color');
  if (breakdown.brand > 0) factors.push('Brand match');
  if (breakdown.size > 0) factors.push('Size match');
  if (breakdown.location > 0) factors.push('Location match');
  if (breakdown.temporal > 0) factors.push('Date proximity');
  if (breakdown.description > 0) factors.push('Description similarity');

  if (factors.length === 0) return 'No matching factors found';

  const lastFactor = factors.pop();
  return factors.length === 0
    ? lastFactor
    : `${factors.join(', ')} and ${lastFactor}`;
}

module.exports = {
  calculateAdvancedMatchScore,
  getConfidenceLevel,
  batchMatch,
  getMatchExplanation
};
