/**
 * Supabase Database Types
 * Simplified type definitions for production build
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          name: string;
          age: number;
          gender: string;
          location_name: string;
          location_lat: number | null;
          location_lng: number | null;
          gym_name: string | null;
          fitness_level: string;
          fitness_goals: string[] | null;
          workout_styles: string[] | null;
          photo_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string | null;
          last_active: string | null;
          today_workout_focus: string | null;
          workout_focus_updated_at: string | null;
        };
      };
      matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          user1_photo_session_approved: boolean;
          user2_photo_session_approved: boolean;
          matched_at: string;
          created_at: string;
        };
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          message: string;
          read_at: string | null;
          created_at: string;
        };
      };
      swipes: {
        Row: {
          id: string;
          user_id: string;
          target_user_id: string;
          action: string;
          created_at: string;
        };
      };
      bug_reports: {
        Row: {
          id: string;
          user_id: string | null;
          description: string;
          page_url: string;
          screenshot_url: string | null;
          browser_info: Record<string, any> | null;
          user_agent: string | null;
          status: string;
          priority: string;
          created_at: string;
          updated_at: string | null;
          resolved_at: string | null;
        };
      };
    };
  };
};
