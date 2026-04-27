import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iixmkjjwqifmbzayugsy.supabase.co'
const supabaseKey = 'sb_publishable_yQx8JYxjpgWf0bDOoJft6Q_YmwsJ-cu'

export const supabase = createClient(supabaseUrl, supabaseKey)