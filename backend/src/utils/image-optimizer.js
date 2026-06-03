const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

// Image optimization configuration
const SIZES = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  medium: { width: 400, height: 400, quality: 85 },
  large: { width: 800, height: 800, quality: 90 }
};

/**
 * Optimize image: compress and create thumbnail
 * @param {string} filePath - Path to original image
 * @returns {Promise<{original: string, thumbnail: string, medium: string}>}
 */
async function optimizeImage(filePath) {
  try {
    const filename = path.basename(filePath);
    const nameWithoutExt = path.parse(filename).name;

    // Create thumbnail (150x150)
    const thumbnailPath = path.join(UPLOAD_DIR, `${nameWithoutExt}-thumb.webp`);
    await sharp(filePath)
      .resize(SIZES.thumbnail.width, SIZES.thumbnail.height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: SIZES.thumbnail.quality })
      .toFile(thumbnailPath);

    // Create medium version (400x400)
    const mediumPath = path.join(UPLOAD_DIR, `${nameWithoutExt}-medium.webp`);
    await sharp(filePath)
      .resize(SIZES.medium.width, SIZES.medium.height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: SIZES.medium.quality })
      .toFile(mediumPath);

    // Convert original to WebP (high quality)
    const optimizedPath = path.join(UPLOAD_DIR, `${nameWithoutExt}.webp`);
    await sharp(filePath)
      .webp({ quality: SIZES.large.quality })
      .toFile(optimizedPath);

    // Delete original file
    await fs.unlink(filePath);

    return {
      original: `/uploads/${nameWithoutExt}.webp`,
      medium: `/uploads/${nameWithoutExt}-medium.webp`,
      thumbnail: `/uploads/${nameWithoutExt}-thumb.webp`
    };
  } catch (error) {
    console.error('Image optimization error:', error);
    throw new Error(`Failed to optimize image: ${error.message}`);
  }
}

/**
 * Get optimized image path (returns medium by default)
 * @param {string} originalPath - Original image path from database
 * @param {string} size - 'thumbnail', 'medium', or 'large'
 * @returns {string} Optimized image path
 */
function getOptimizedPath(originalPath, size = 'medium') {
  if (!originalPath) return null;

  const parsed = path.parse(originalPath);
  const sizeMap = {
    thumbnail: '-thumb',
    medium: '-medium',
    large: ''
  };

  return originalPath.replace(
    '.webp',
    `${sizeMap[size] || '-medium'}.webp`
  );
}

module.exports = {
  optimizeImage,
  getOptimizedPath,
  SIZES
};
