import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";

function getSiteBaseUrl(requestOrigin: string): string {
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  if (requestOrigin.includes("localhost") || requestOrigin.includes("127.0.0.1")) {
    return requestOrigin;
  }
  return "https://six9chat.vercel.app";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = (searchParams.get("type") as EmailOtpType) || "email";
  const next = searchParams.get("next") ?? "/chat";

  const siteUrl = getSiteBaseUrl(origin);

  if (code || token_hash) {
    const cookieStore = await cookies();
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore in context where cookies cannot be mutated
            }
          },
        },
      });

      let authSuccess = false;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) authSuccess = true;
      } else if (token_hash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type,
        });
        if (!error) authSuccess = true;
      }

      if (authSuccess) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            // Check if profile exists and has sequential UID
            const { data: profile } = await supabase
              .from("profiles")
              .select("uid")
              .eq("id", user.id)
              .maybeSingle();

            let uid = profile?.uid;
            if (!uid || !/^S9-\d+$/i.test(uid)) {
              // Find highest sequential number starting from S9-01
              const { data: allProfiles } = await supabase
                .from("profiles")
                .select("uid");

              let highestSeq = 0;
              if (allProfiles) {
                for (const p of allProfiles) {
                  if (p.uid) {
                    const m = p.uid.match(/^S9-(\d+)$/i);
                    if (m) {
                      const num = parseInt(m[1], 10);
                      if (num < 1000 && num > highestSeq) highestSeq = num;
                    }
                  }
                }
              }

              const nextSeq = highestSeq + 1;
              const padded = nextSeq < 10 ? `0${nextSeq}` : `${nextSeq}`;
              uid = `S9-${padded}`;

              await supabase.from("profiles").upsert(
                {
                  id: user.id,
                  uid: uid,
                  full_name: user.email ? user.email.split("@")[0] : "Six9 User",
                  username: `user_${uid.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`,
                  email: user.email || "",
                  status: "Hey there! I am using Six9Chat 🚀",
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "id" }
              );
            }
          }
        } catch (profileErr) {
          console.warn("Callback UID profile setup notice:", profileErr);
        }

        return NextResponse.redirect(`${siteUrl}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=auth_error`);
}
