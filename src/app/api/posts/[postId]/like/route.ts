import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
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
      return NextResponse.json(
        { success: false, error: 'Already liked' },
        { status: 400 }
      );
    }

    // Add like
    const { error: likeError } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: user.id });

    if (likeError) {
      throw likeError;
    }

    // Increment likes count
    await supabase.rpc('increment_likes', { post_id: postId });

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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
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

    // Note: likes_count will be automatically decremented by trigger

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
