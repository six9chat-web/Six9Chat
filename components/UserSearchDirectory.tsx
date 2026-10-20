'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Avatar } from '@/components/ui/Avatar';

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

      // Direct plain text search without symbol requirements matching username, full_name, or email
      const cleanSearch = searchTerm.trim().replace(/^@+/, "");
      if (!cleanSearch) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      query = query.or(`username.ilike.%${cleanSearch}%,full_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`);

      console.log('SEARCH TERM:', searchTerm);
      const { data, error } = await query.limit(20);
      console.log('FETCHED PROFILES DATA:', data, 'ERROR:', error);

      if (error || !data || data.length === 0) {
        if (error) console.error('Search error:', error.message);
        // Resilient fallback to server API search route
        try {
          const res = await fetch(`/api/user/search?searchTerm=${encodeURIComponent(cleanSearch)}${user?.id ? `&excludeId=${encodeURIComponent(user.id)}` : ''}`);
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.users) && json.users.length > 0) {
              setProfiles(json.users);
              setLoading(false);
              return;
            }
          }
        } catch (apiErr) {
          console.warn("UserSearchDirectory API fallback notice:", apiErr);
        }
        setProfiles(data || []);
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
        placeholder="Type a username or email to search..."
        className="w-full px-4 py-2 border rounded-lg bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="mt-4">
        {loading ? (
          <div className="text-center py-2 text-gray-400">Searching...</div>
        ) : !searchTerm.trim() ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            Type a username or email to search for people.
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-2 text-gray-400">
            No user found matching &quot;{searchTerm.trim()}&quot;
          </div>
        ) : (
          <ul className="space-y-2">
            {profiles.map((profile) => (
              <li key={profile.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={profile.avatar_url || profile.avatarUrl || ""}
                    alt={profile.full_name || profile.username || "User"}
                    className="w-10 h-10 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-bold truncate">{profile.full_name || profile.username}</div>
                  </div>
                </div>
                <button 
                  onClick={() => console.log('Request to:', profile.id)}
                  className="px-3 py-1 bg-gradient-to-r from-[#4D8DBA] to-[#97D7FF] text-[#086288] font-bold rounded-md hover:brightness-105 text-sm shrink-0"
                >
                  + Request
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
