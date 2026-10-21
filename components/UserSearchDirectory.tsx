'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Avatar } from '@/components/ui/Avatar';

// Create supabase client ONCE outside component to prevent infinite re-renders
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UserSearchDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  // Fetch current user ID once on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      currentUserIdRef.current = data.user?.id ?? null;
    });
  }, []);

  const fetchUsers = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);

    const cleanSearch = term.trim().replace(/^@+/, '');

    // Build query
    let query = supabase.from('profiles').select('*');

    // Exclude current logged-in user
    if (currentUserIdRef.current) {
      query = query.neq('id', currentUserIdRef.current);
    }

    // Apply search filter if term exists
    if (cleanSearch.length > 0) {
      query = query.or(
        `username.ilike.%${cleanSearch}%,full_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`
      );
    }

    const { data, error: dbError } = await query.limit(30);

    const filterOutSelf = (list: any[]) => {
      const myId = currentUserIdRef.current;
      return list.filter((p: any) => {
        if (!p) return false;
        if (myId && (p.id === myId || String(p.id).toLowerCase() === String(myId).toLowerCase())) return false;
        return true;
      });
    };

    if (dbError) {
      // Fallback to server-side API search route
      try {
        const params = new URLSearchParams({ searchTerm: cleanSearch });
        if (currentUserIdRef.current) params.set('excludeId', currentUserIdRef.current);

        const res = await fetch(`/api/user/search?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.users)) {
            setProfiles(filterOutSelf(json.users));
            setLoading(false);
            return;
          }
        }
      } catch {
        // silent — show empty state
      }
      setError('Could not load users. Please try again.');
      setProfiles([]);
    } else {
      setProfiles(filterOutSelf(data ?? []));
    }

    setLoading(false);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchUsers]);

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-slate-900 text-white rounded-xl">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search users by name or username..."
        className="w-full px-4 py-2 border rounded-lg bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="mt-4">
        {loading ? (
          <div className="text-center py-2 text-gray-400">Searching...</div>
        ) : error ? (
          <div className="text-center py-2 text-red-400">{error}</div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-2 text-gray-400">
            {searchTerm ? `No user found for "${searchTerm}"` : 'No other users found.'}
          </div>
        ) : (
          <ul className="space-y-2">
            {profiles.map((profile) => (
              <li key={profile.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={profile.avatar_url || profile.avatarUrl || ''}
                    alt={profile.full_name || profile.username || 'User'}
                    className="w-10 h-10 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-bold truncate">{profile.full_name || profile.username}</div>
                    {profile.username && (
                      <div className="text-sm text-gray-400 truncate">@{profile.username}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    // TODO: Wire up send-request API
                    fetch('/api/user/send-request', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ targetUserId: profile.id }),
                    }).catch(() => {});
                  }}
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
