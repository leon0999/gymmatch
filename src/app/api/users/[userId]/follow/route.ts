import { NextRequest, NextResponse } from 'next/server';
import { createServerClientFromRequest } from '@/lib/supabase-server';

/**
 * POST /api/users/[userId]/follow
 *
 * 사용자 팔로우
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

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

    // Cannot follow yourself
    if (user.id === userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already following' },
        { status: 400 }
      );
    }

    // Create follow relationship
    const { error: followError } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: userId,
      });

    if (followError) {
      throw followError;
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully followed user',
    });
  } catch (error: any) {
    console.error('Follow user error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[userId]/follow
 *
 * 팔로우 취소
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

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

    // Remove follow relationship
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unfollowed user',
    });
  } catch (error: any) {
    console.error('Unfollow user error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
