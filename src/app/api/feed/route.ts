import { NextRequest, NextResponse } from 'next/server';
import { createServerClientFromRequest } from '@/lib/supabase-server';

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

    // Use server client to get current user from request cookies
    const supabase = createServerClientFromRequest(request);
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch posts with user and photographer info
    const { data: posts, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles!posts_user_id_fkey(name, photo_url),
        photographer:profiles!posts_photographer_id_fkey(name, photo_url),
        post_likes(user_id)
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

    // 🔍 DEBUG: 실제 DB 값 확인
    console.log('📊 Feed Debug:');
    for (const post of posts || []) {
      // 실제 카운트 조회
      const { count: actualLikes } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      const { count: actualComments } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      console.log(`  Post ${post.id.substring(0, 8)}...:`);
      console.log(`    DB likes_count: ${post.likes_count}`);
      console.log(`    Actual likes: ${actualLikes}`);
      console.log(`    DB comments_count: ${post.comments_count}`);
      console.log(`    Actual comments: ${actualComments}`);
    }

    // Add isLikedByCurrentUser to each post
    const postsWithLikeStatus = (posts || []).map((post: any) => ({
      ...post,
      isLikedByCurrentUser: user ? post.post_likes?.some((like: any) => like.user_id === user.id) : false,
      post_likes: undefined, // Remove raw likes data
    }));

    return NextResponse.json({
      success: true,
      data: {
        posts: postsWithLikeStatus,
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
