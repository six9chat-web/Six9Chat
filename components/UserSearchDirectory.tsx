'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function UserSearchDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Supabase client initialization
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rjoxghjmtrsfdhbfkodr.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_uFcHccTx94Y8Kx2Qy1AsHQ_V-qovUQw'
  );

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);

      // Current logged-in user check
      const { data: { user } } = await supabase.auth.getUser();

      // Database query for profiles
      let query = supabase
        .from('profiles')
        .select('*');

      // Exclude current user if logged in
      if (user?.id) {
        query = query.neq('id', user.id);
      }

      // Clean search input and apply case-insensitive ilike filter
      const cleanSearch = searchTerm.trim().replace(/^@/, '');
      if (cleanSearch.length > 0) {
        query = query.ilike('username', `%${cleanSearch}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) {
        console.error('Search error:', error.message);
        setProfiles([]);
      } else {
        setProfiles(data || []);
      }

      setLoading(false);
    };

    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, supabase]);

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-slate-900 text-white rounded-xl">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search users by username..."
        className="w-full px-4 py-2 border rounded-lg bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="mt-4">
        {loading ? (
          <div className="text-center py-2 text-gray-400">Searching...</div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-2 text-gray-400">
            {searchTerm ? `No user found for "${searchTerm}"` : 'No other users found.'}
          </div>
        ) : (
          <ul className="space-y-2">
            {profiles.map((profile) => (
              <li key={profile.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div>
                  <div className="font-bold">{profile.full_name || profile.username}</div>
                  <div className="text-sm text-gray-400">@{profile.username}</div>
                </div>
                <button 
                  onClick={() => console.log('Chat with:', profile.id)}
                  className="px-3 py-1 bg-blue-600 rounded-md hover:bg-blue-500 text-sm"
                >
                  Chat
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
