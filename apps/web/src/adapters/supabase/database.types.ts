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
    };
    Views: { [_ in never]: never };
    Functions: {
      set_time_zone: {
        Args: { requested_time_zone: string };
        Returns: string;
      };
      public_display_names: {
        Args: { user_ids: string[] };
        Returns: { id: string; display_name: string }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
