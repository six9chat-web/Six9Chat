'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Avatar } from '@/components/ui/Avatar';
import { useTranslation } from '@/lib/LanguageContext';

// Create supabase client ONCE outside component to prevent infinite re-renders
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface SearchProfile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  avatarUrl?: string;
  isRequested?: boolean;
}

export default function UserSearchDirectory() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
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

    const filterOutSelf = (list: SearchProfile[]) => {
      const myId = currentUserIdRef.current;
      return list.filter((p: SearchProfile) => {
        if (!p) return false;
        if (myId && (p.id === myId || String(p.id).toLowerCase() === String(myId).toLowerCase())) return false;
        return true;
      });
    };

    // Check existing chat_requests sent by current user
    const pendingReceiverIds = new Set<string>();
    if (currentUserIdRef.current) {
      try {
        const { data: existingReqs } = await supabase
          .from('chat_requests')
          .select('receiver_id, status')
          .eq('sender_id', currentUserIdRef.current)
          .eq('status', 'pending');
        if (existingReqs) {
          existingReqs.forEach((r: { receiver_id: string }) => pendingReceiverIds.add(r.receiver_id));
        }
      } catch {}
    }

    const attachRequestState = (list: SearchProfile[]) => {
      return filterOutSelf(list).map((p: SearchProfile) => ({
        ...p,
        isRequested: pendingReceiverIds.has(p.id) || p.isRequested,
      }));
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
            setProfiles(attachRequestState(json.users));
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
      setProfiles(attachRequestState((data as SearchProfile[]) ?? []));
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

  const handleSendRequest = useCallback(async (targetUser: SearchProfile) => {
    const myId = currentUserIdRef.current;
    if (!myId) return;

    // 1. Immediately update UI state to "Pending"
    setProfiles((prev) =>
      prev.map((p) => (p.id === targetUser.id ? { ...p, isRequested: true } : p))
    );

    // 2. Persist to chat_requests in Supabase via API route
    try {
      await fetch('/api/user/send-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: myId,
          receiverId: targetUser.id,
          message: 'wants to start a conversation with you',
        }),
      });
    } catch {}

    // Direct client upsert backup
    try {
      await supabase.from('chat_requests').upsert(
        {
          sender_id: myId,
          receiver_id: targetUser.id,
          status: 'pending',
          message: 'wants to start a conversation with you',
        },
        { onConflict: 'sender_id,receiver_id' }
      );
    } catch {}

    // Broadcast realtime event
    try {
      const channel = supabase.channel('public:messages');
      const reqId = `req-${Date.now()}`;
      await channel.send({
        type: 'broadcast',
        event: 'chat_request',
        payload: {
          id: reqId,
          senderId: myId,
          receiverId: targetUser.id,
          status: 'pending',
          message: 'wants to start a conversation with you',
          createdAt: 'Just now',
        },
      });
    } catch {}
  }, []);

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-slate-900 text-white rounded-xl">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={t("searchUsers", "Search users by name or username...")}
        className="w-full px-4 py-2 border rounded-lg bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="mt-4">
        {loading ? (
          <div className="text-center py-2 text-gray-400">{t("searching", "Searching...")}</div>
        ) : error ? (
          <div className="text-center py-2 text-red-400">{error}</div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-2 text-gray-400">
            {searchTerm ? `No user found for "${searchTerm}"` : t("noUsersFound", "No other users found.")}
          </div>
        ) : (
          <ul className="space-y-2">
            {profiles.map((profile) => (
              <li key={profile.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={profile.avatar_url || profile.avatarUrl || ''}
                    alt={profile.username || profile.full_name || 'User'}
                    className="w-10 h-10 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">
                      {profile.username || 'User'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    disabled={profile.isRequested}
                    onClick={() => handleSendRequest(profile)}
                    className={`px-3 py-1 font-bold rounded-md text-sm shrink-0 transition ${
                      profile.isRequested
                        ? 'bg-[#4D8DBA]/30 text-[#97D7FF] cursor-default'
                        : 'bg-gradient-to-r from-[#4D8DBA] to-[#97D7FF] text-[#086288] hover:brightness-105 active:scale-95 cursor-pointer'
                    }`}
                  >
                    {profile.isRequested ? t("pending", "Pending") : `+ ${t("request", "Request")}`}
                  </button>
                  <button
                    onClick={() => {
                      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
                    }}
                    className="px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 font-semibold rounded-md text-sm shrink-0 transition"
                    title="Delete / Remove user"
                  >
                    {t("delete", "Delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
