const multer = require('multer');
const path = require('path');

// Files are held in memory and streamed to Supabase Storage by utils/storage.js
// (Vercel's filesystem is ephemeral, so nothing is written to local disk).
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype))
    cb(null, true);
  else cb(new Error('Only image files are allowed'));
};

// 4MB cap: Vercel serverless rejects request bodies over ~4.5MB, so a larger
// multer limit would let uploads through locally that the platform 413s in prod.
const upload = multer({ storage, fileFilter, limits: { fileSize: 4 * 1024 * 1024 } });
module.exports = upload;
