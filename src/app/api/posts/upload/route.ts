import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/posts/upload
 *
 * 파트너가 촬영한 운동 사진/동영상 업로드
 * CRITICAL: Only matched partners can upload photos of each other
 */
export async function POST(request: NextRequest) {
  try {
    const {
      userId,          // 사진 주인공 (subject)
      photographerId,  // 찍은 사람 (photographer)
      matchId,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      workoutType,
      exerciseName,
      caption,
    } = await request.json();

    // Validate required fields
    if (!userId || !photographerId || !matchId || !mediaType || !mediaUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Security check: photographer must be current user
    if (user.id !== photographerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only upload as yourself' },
        { status: 403 }
      );
    }

    // Verify match exists and includes both users
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !matchData) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    // Verify photographer and subject are in the match
    const isPhotographerInMatch =
      matchData.user1_id === photographerId || matchData.user2_id === photographerId;
    const isSubjectInMatch =
      matchData.user1_id === userId || matchData.user2_id === userId;

    if (!isPhotographerInMatch || !isSubjectInMatch) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Users must be matched partners' },
        { status: 403 }
      );
    }

    // Verify photographer and subject are different people
    if (userId === photographerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You cannot photograph yourself' },
        { status: 403 }
      );
    }

    // Create post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        photographer_id: photographerId,
        match_id: matchId,
        media_type: mediaType,
        media_url: mediaUrl,
        thumbnail_url: thumbnailUrl,
        workout_type: workoutType,
        exercise_name: exerciseName,
        caption: caption,
      })
      .select()
      .single();

    if (postError) {
      console.error('Post creation error:', postError);
      return NextResponse.json(
        { success: false, error: postError.message },
        { status: 500 }
      );
    }

    // Increment posts_count for the subject
    await supabase.rpc('increment_user_posts', { user_id: userId });

    // Create notification for the subject
    if (userId !== photographerId) {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'new_post',
          from_user_id: photographerId,
          post_id: post.id,
        });
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    console.error('Upload post error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
