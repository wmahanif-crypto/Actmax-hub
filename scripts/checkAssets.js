const { supabase } = require('../lib/supabase');

(async () => {
  const candidates = ['master_assets','assets','Assets','Asset','asset_master','MasterAssets'];
  for (const tbl of candidates) {
    try {
      console.log('\n== Testing table:', tbl, '==');
      const res = await supabase.from(tbl).select('*').limit(5);
      console.log('error:', res.error ? res.error.message : null);
      console.log('data length:', res.data ? res.data.length : null);
      if (res.data) console.log('sample:', res.data.slice(0,3));
    } catch (e) {
      console.error('exception for', tbl, e.message || e);
    }
  }
})();
