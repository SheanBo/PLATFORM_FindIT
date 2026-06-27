// Match-scoring logic shared by the auto-match (/run) and manual-match
// (/manual) endpoints. Weights: category 30, color 20, brand 20, size 15,
// location 15 (max 100). Auto-matching creates a match at or above
// MATCH_THRESHOLD; manual matching records the score regardless.
const MATCH_THRESHOLD = 75;

function scoreMatch(item, report) {
  let score = 0;
  const breakdown = {};

  if (item.Category_ID === report.Category_ID) { score += 30; breakdown.category = 30; } else breakdown.category = 0;
  if (item.Item_Color && report.Item_Color && item.Item_Color.toLowerCase() === report.Item_Color.toLowerCase()) { score += 20; breakdown.color = 20; } else breakdown.color = 0;
  if (item.Item_Brand && report.Item_Brand && item.Item_Brand.toLowerCase() === report.Item_Brand.toLowerCase()) { score += 20; breakdown.brand = 20; } else breakdown.brand = 0;
  if (item.Item_Size && report.Item_Size && item.Item_Size.toLowerCase() === report.Item_Size.toLowerCase()) { score += 15; breakdown.size = 15; } else breakdown.size = 0;
  if (item.Location_ID === report.Location_ID) { score += 15; breakdown.location = 15; } else breakdown.location = 0;

  return { score, breakdown };
}

module.exports = { scoreMatch, MATCH_THRESHOLD };
