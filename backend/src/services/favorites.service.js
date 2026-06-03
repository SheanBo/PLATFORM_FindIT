/**
 * Favorites Service
 * Manages user favorites and bookmarks
 */

const { getAsync, runAsync, allAsync } = require('../database/init');

/**
 * Add item to favorites
 * @param {number} userId - User ID
 * @param {number} itemId - Item ID (can be found item or lost report)
 * @param {string} type - 'found_item' or 'lost_report'
 */
async function addFavorite(userId, itemId, type) {
  try {
    // Check if already favorited
    const existing = await getAsync(
      'SELECT * FROM USER_FAVORITES WHERE User_ID=? AND Item_ID=? AND Item_Type=?',
      [userId, itemId, type]
    );

    if (existing) {
      return { success: false, message: 'Already favorited' };
    }

    // Add to favorites
    await runAsync(
      'INSERT INTO USER_FAVORITES (User_ID, Item_ID, Item_Type, Date_Added) VALUES (?,?,?,CURRENT_DATE)',
      [userId, itemId, type]
    );

    return { success: true, message: 'Added to favorites' };
  } catch (error) {
    throw new Error(`Failed to add favorite: ${error.message}`);
  }
}

/**
 * Remove from favorites
 * @param {number} userId - User ID
 * @param {number} itemId - Item ID
 * @param {string} type - 'found_item' or 'lost_report'
 */
async function removeFavorite(userId, itemId, type) {
  try {
    const result = await runAsync(
      'DELETE FROM USER_FAVORITES WHERE User_ID=? AND Item_ID=? AND Item_Type=?',
      [userId, itemId, type]
    );

    if (result.changes === 0) {
      return { success: false, message: 'Not found in favorites' };
    }

    return { success: true, message: 'Removed from favorites' };
  } catch (error) {
    throw new Error(`Failed to remove favorite: ${error.message}`);
  }
}

/**
 * Get user's favorite items
 * @param {number} userId - User ID
 * @param {number} limit - Max results
 */
async function getUserFavorites(userId, limit = 50) {
  try {
    const favorites = await allAsync(`
      SELECT uf.*,
             fi.Item_Name, fi.Item_Color, fi.Item_Brand, fi.Photo_Path, 'found_item' AS source
      FROM USER_FAVORITES uf
      LEFT JOIN FOUND_ITEM fi ON uf.Item_ID=fi.Item_ID AND uf.Item_Type='found_item'
      WHERE uf.User_ID=?
      LIMIT ?
    `, [userId, limit]);

    return favorites;
  } catch (error) {
    throw new Error(`Failed to get favorites: ${error.message}`);
  }
}

/**
 * Check if item is favorited
 * @param {number} userId - User ID
 * @param {number} itemId - Item ID
 * @param {string} type - 'found_item' or 'lost_report'
 */
async function isFavorited(userId, itemId, type) {
  try {
    const favorite = await getAsync(
      'SELECT * FROM USER_FAVORITES WHERE User_ID=? AND Item_ID=? AND Item_Type=?',
      [userId, itemId, type]
    );

    return !!favorite;
  } catch (error) {
    return false;
  }
}

module.exports = {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  isFavorited
};
