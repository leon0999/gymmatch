import { NextRequest, NextResponse } from 'next/server';
import { createServerClientFromRequest } from '@/lib/supabase-server';

/**
 * DELETE /api/posts/[postId]/comments/[commentId]
 *
 * 댓글 삭제 (본인만 가능)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;

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

    // Check if user owns this comment
    const { data: comment } = await supabase
      .from('post_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!comment || comment.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete comment
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      throw error;
    }

    // ✅ Database Trigger가 자동으로 comments_count 업데이트
    console.log('✅ Comment deleted - trigger will update count automatically');

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
