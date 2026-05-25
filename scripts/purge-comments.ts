// Load environment variables if running in Node 20.6+ without --env-file
try {
  process.loadEnvFile();
} catch (e) {
  // Will fail silently if not supported or file doesn't exist.
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('Make sure you have a .env file and are running this script with --env-file=.env if using an older Node version.');
  process.exit(1);
}

async function purgeComments() {
  console.log('Purging all comments from drr_comments table...');
  
  // Use native fetch to avoid @supabase/supabase-js realtime WebSocket issues in Node 20
  const url = new URL('/rest/v1/drr_comments?id=not.is.null', supabaseUrl);
  
  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      'apikey': supabaseServiceKey as string,
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error purging comments:', response.status, errorText);
    process.exit(1);
  }

  console.log('Successfully purged all comments.');
}

purgeComments();
