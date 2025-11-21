import { NextRequest, NextResponse } from 'next/server';
import { createServerClientFromRequest } from '@/lib/supabase-server';

/**
 * GET /api/posts/[postId]
 *
 * 포스트 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Use Request-based client for Next.js 16 compatibility
    const supabase = createServerClientFromRequest(request);

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles!posts_user_id_fkey(name, photo_url, age, location_name),
        photographer:profiles!posts_photographer_id_fkey(name, photo_url)
      `)
      .eq('id', postId)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Increment views count
    await supabase
      .from('posts')
      .update({ views_count: post.views_count + 1 })
      .eq('id', postId);

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[postId]
 *
 * 포스트 삭제 (본인만 가능)
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is the photographer (uploader) of this post
    const { data: post } = await supabase
      .from('posts')
      .select('photographer_id')
      .eq('id', postId)
      .single();

    if (!post || post.photographer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the photographer can delete this post' },
        { status: 403 }
      );
    }

    // Delete post
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
