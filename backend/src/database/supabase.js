require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

// Wrapper functions to match old SQLite API
async function runAsync(sql, params = []) {
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      query: sql,
      params: params
    }).catch(() => null);

    if (error) throw error;
    return { lastID: null, changes: data?.changes || 0 };
  } catch (err) {
    throw new Error(`Database execution error: ${err.message}`);
  }
}

async function getAsync(sql, params = []) {
  try {
    const { data, error } = await supabase.rpc('query_single', {
      query: sql,
      params: params
    }).catch(() => null);

    if (error) throw error;
    return data?.[0] || null;
  } catch (err) {
    throw new Error(`Database query error: ${err.message}`);
  }
}

async function allAsync(sql, params = []) {
  try {
    const { data, error } = await supabase.rpc('query_many', {
      query: sql,
      params: params
    }).catch(() => null);

    if (error) throw error;
    return data || [];
  } catch (err) {
    throw new Error(`Database query error: ${err.message}`);
  }
}

async function execAsync(sql) {
  try {
    const { error } = await supabase.rpc('execute_sql_batch', {
      query: sql
    }).catch(() => null);

    if (error) throw error;
  } catch (err) {
    throw new Error(`Database batch error: ${err.message}`);
  }
}

// Simplified initialization - schema already exists in Supabase
async function initializeDatabase() {
  try {
    // Test connection
    const { data, error } = await supabase
      .from('online_user')
      .select('count')
      .limit(1)
      .catch(() => ({ data: null, error: true }));

    if (error || !data) {
      throw new Error('Cannot connect to Supabase database. Please ensure the migration has been applied.');
    }

    console.log('✅ Connected to Supabase database');
    return true;
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  }
}

// Direct table access for convenience
const tables = {
  person: supabase.from('person'),
  online_user: supabase.from('online_user'),
  location: supabase.from('location'),
  item_category: supabase.from('item_category'),
  storage_section: supabase.from('storage_section'),
  found_item: supabase.from('found_item'),
  lost_report: supabase.from('lost_report'),
  item_match: supabase.from('item_match'),
  claim: supabase.from('claim'),
  audit_log: supabase.from('audit_log'),
  notification: supabase.from('notification'),
  user_favorites: supabase.from('user_favorites'),
  user_messages: supabase.from('user_messages'),
  timeline_events: supabase.from('timeline_events'),
  user_analytics: supabase.from('user_analytics'),
  notification_preferences: supabase.from('notification_preferences')
};

module.exports = {
  supabase,
  tables,
  initializeDatabase,
  runAsync,
  getAsync,
  allAsync,
  execAsync
};

if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database is ready');
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
