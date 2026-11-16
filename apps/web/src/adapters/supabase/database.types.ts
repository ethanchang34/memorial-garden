export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          time_zone: string;
          time_zone_changed_at: string | null;
          locale: string;
          is_admin: boolean;
          status: 'active' | 'suspended' | 'banned';
          created_at: string;
        };
        Insert: never;
        Update: {
          display_name?: string;
          locale?: string;
        };
        Relationships: [];
      };
      memorials: {
        Row: {
          id: string;
          slug: string;
          owner_id: string | null;
          full_name: string;
          born_date: string | null;
          born_precision: 'day' | 'month' | 'year' | 'circa' | null;
          died_date: string;
          died_precision: 'day' | 'month' | 'year' | 'circa';
          epitaph: string | null;
          kind: 'person' | 'pet';
          visibility: 'public';
          status: 'draft' | 'published' | 'hidden' | 'removed';
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          owner_id: string;
          full_name: string;
          born_date?: string | null;
          born_precision?: 'day' | 'month' | 'year' | 'circa' | null;
          died_date: string;
          died_precision: 'day' | 'month' | 'year' | 'circa';
          epitaph?: string | null;
          kind?: 'person' | 'pet';
        };
        Update: {
          full_name?: string;
          born_date?: string | null;
          born_precision?: 'day' | 'month' | 'year' | 'circa' | null;
          died_date?: string;
          died_precision?: 'day' | 'month' | 'year' | 'circa';
          epitaph?: string | null;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          memorial_id: string;
          author_id: string;
          body: string;
          status: 'visible' | 'hidden_by_owner' | 'removed';
          created_at: string;
          edited_at: string | null;
        };
        Insert: {
          memorial_id: string;
          author_id: string;
          body: string;
        };
        Update: {
          body?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      set_time_zone: {
        Args: { requested_time_zone: string };
        Returns: string;
      };
      publish_memorial: {
        Args: { memorial_id: string };
        Returns: string;
      };
      public_display_names: {
        Args: { user_ids: string[] };
        Returns: { id: string; display_name: string }[];
      };
      candle_state: {
        Args: { target_memorial: string };
        Returns: { lit_count: number; lit_until: string | null; lit_today: boolean }[];
      };
      set_note_hidden: {
        Args: { note_id: string; hidden: boolean };
        Returns: string;
      };
      light_candle: {
        Args: { target_memorial: string };
        Returns: { lit_count: number; lit_until: string | null; lit_today: boolean }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
