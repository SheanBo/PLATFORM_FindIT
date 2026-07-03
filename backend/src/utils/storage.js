const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const BUCKET = process.env.SUPABASE_BUCKET || 'item-photos';
let _sb = null;
function client() {
  if (!_sb) _sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  return _sb;
}

// Upload an image buffer to Supabase Storage and return its public URL.
async function uploadPhoto(buffer, originalName, mimetype) {
  const ext = path.extname(originalName || '') || '.jpg';
  const key = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const { error } = await client().storage.from(BUCKET).upload(key, buffer, {
    contentType: mimetype, upsert: false,
  });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  const { data } = client().storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

module.exports = { uploadPhoto };
