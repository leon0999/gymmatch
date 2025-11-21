/**
 * GymMatch - Server-Side Supabase Client
 *
 * For use in Next.js API routes and Server Components
 * This client can access auth cookies from the request
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create a Supabase client for server-side use (API routes)
 * This reads the auth token from cookies properly using SSR package
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client for API routes (Next.js 16 compatible)
 * Uses Request object directly to access cookies AND Authorization header
 */
export function createServerClientFromRequest(
  request: NextRequest,
  response?: NextResponse
) {
  // Check for Authorization header first (more reliable for POST requests)
  const authHeader = request.headers.get('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('✅ Using Authorization header, token length:', token.length);

    return createSupabaseServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              if (response) {
                response.cookies.set(name, value, options);
              }
            });
          },
        },
      }
    );
  }

  // Fallback to cookies if no Authorization header
  console.log('⚠️  No Authorization header, falling back to cookies');
  return createSupabaseServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            if (response) {
              response.cookies.set(name, value, options);
            }
          });
        },
      },
    }
  );
}
