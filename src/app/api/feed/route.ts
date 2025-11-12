import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/feed
 *
 * 홈 피드 조회 (Instagram-style)
 * - 최신 포스트 순서로 반환
 * - 페이지네이션 지원
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = page * limit;

    // Get current user (optional - for personalization later)
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch posts with user and photographer info
    const { data: posts, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles!posts_user_id_fkey(name, photo_url),
        photographer:profiles!posts_photographer_id_fkey(name, photo_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Feed error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        posts: posts || [],
        total: count || 0,
        page,
        pageSize: limit,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error: any) {
    console.error('Feed API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
