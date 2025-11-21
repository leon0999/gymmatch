import { NextRequest, NextResponse } from 'next/server';
import { createServerClientFromRequest } from '@/lib/supabase-server';

/**
 * POST /api/posts/[postId]/like
 *
 * 포스트 좋아요
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Use Request-based client for Next.js 16 compatibility
    const supabase = createServerClientFromRequest(request);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if already liked
    const { data: existing } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      console.log('ℹ️  User already liked this post, returning current state:', { postId, userId: user.id });

      // Get current count and return success with current state
      const { data: currentPost } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      return NextResponse.json({
        success: true,
        message: 'Already liked',
        alreadyLiked: true,
        likes_count: currentPost?.likes_count || 0,
      });
    }

    // Add like
    const { error: likeError } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: user.id });

    if (likeError) {
      throw likeError;
    }

    // ✅ Database Trigger가 자동으로 likes_count 업데이트
    console.log('✅ Like added - trigger will update count automatically');

    // Get post owner to create notification
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (post && post.user_id !== user.id) {
      // Create notification (only if not liking own post)
      await supabase
        .from('notifications')
        .insert({
          user_id: post.user_id,
          type: 'like',
          from_user_id: user.id,
          post_id: postId,
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Post liked successfully',
    });
  } catch (error: any) {
    console.error('Like post error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[postId]/like
 *
 * 좋아요 취소
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Use Request-based client for Next.js 16 compatibility
    const supabase = createServerClientFromRequest(request);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Remove like
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    // ✅ Database Trigger가 자동으로 likes_count 업데이트
    console.log('✅ Like removed - trigger will update count automatically');

    return NextResponse.json({
      success: true,
      message: 'Like removed successfully',
    });
  } catch (error: any) {
    console.error('Unlike post error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
