import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServerClientFromRequest } from '@/lib/supabase-server';

/**
 * GET /api/posts/[postId]/comments
 *
 * 포스트 댓글 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = page * limit;

    const supabase = await createServerClient();

    const { data: comments, error, count } = await supabase
      .from('post_comments')
      .select(`
        *,
        user:profiles!post_comments_user_id_fkey(name, photo_url)
      `, { count: 'exact' })
      .eq('post_id', postId)
      .order('created_at', { ascending: true })  // 오래된 댓글 먼저
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        comments: comments || [],
        total: count || 0,
        page,
        pageSize: limit,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error: any) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts/[postId]/comments
 *
 * 댓글 작성
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Debug: 쿠키 확인
    const allCookies = request.cookies.getAll();
    console.log('🍪 POST Request - Total cookies:', allCookies.length);
    console.log('🍪 Cookie names:', allCookies.map(c => c.name).join(', '));
    const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-'));
    console.log('🔑 Supabase cookies:', supabaseCookies.length);
    if (supabaseCookies.length > 0) {
      supabaseCookies.forEach(cookie => {
        console.log(`   ${cookie.name}: ${cookie.value?.substring(0, 50)}...`);
      });
    }

    const { comment } = await request.json();

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { success: false, error: 'Comment text is required' },
        { status: 400 }
      );
    }

    // Use Request-based client for Next.js 16 compatibility
    const supabase = createServerClientFromRequest(request);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('👤 POST Comment - User:', user?.id, 'Error:', authError?.message);

    if (!user) {
      console.log('❌ No user found - returning 401');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Add comment
    const { data: newComment, error: commentError } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        comment: comment.trim(),
      })
      .select(`
        *,
        user:profiles!post_comments_user_id_fkey(name, photo_url)
      `)
      .single();

    if (commentError) {
      throw commentError;
    }

    // ✅ Database Trigger가 자동으로 comments_count 업데이트
    console.log('✅ Comment added - trigger will update count automatically');

    // Get post owner to create notification
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (post && post.user_id !== user.id) {
      // Create notification (only if not commenting on own post)
      await supabase
        .from('notifications')
        .insert({
          user_id: post.user_id,
          type: 'comment',
          from_user_id: user.id,
          post_id: postId,
          comment_id: newComment.id,
        });
    }

    return NextResponse.json({
      success: true,
      data: newComment,
    });
  } catch (error: any) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
