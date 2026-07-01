/**
 * Tipos de la base de datos TrackBag. Mantenidos a mano en sincronía con
 * supabase/migrations. Si cambias el esquema, regenera con:
 *   npx supabase gen types typescript --linked > src/lib/database.types.ts
 */
export type ClubCategory = 'driver' | 'madera' | 'hibrido' | 'hierro' | 'wedge' | 'putter';
export type ClubCondition = 'nuevo' | 'bueno' | 'usado';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          handicap: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          phone?: string | null;
          handicap?: number | null;
        };
        Update: {
          full_name?: string;
          phone?: string | null;
          handicap?: number | null;
        };
        Relationships: [];
      };
      bags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          rfid_tag_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          rfid_tag_id?: string | null;
        };
        Update: {
          name?: string;
          rfid_tag_id?: string | null;
        };
        Relationships: [];
      };
      clubs: {
        Row: {
          id: string;
          bag_id: string;
          user_id: string;
          category: ClubCategory;
          brand: string;
          model: string;
          loft: number | null;
          shaft_flex: string | null;
          shaft_material: string | null;
          serial_number: string | null;
          condition: ClubCondition;
          purchase_date: string | null;
          estimated_value: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bag_id: string;
          user_id: string;
          category: ClubCategory;
          brand: string;
          model: string;
          loft?: number | null;
          shaft_flex?: string | null;
          shaft_material?: string | null;
          serial_number?: string | null;
          condition?: ClubCondition;
          purchase_date?: string | null;
          estimated_value?: number | null;
          notes?: string | null;
        };
        Update: {
          bag_id?: string;
          category?: ClubCategory;
          brand?: string;
          model?: string;
          loft?: number | null;
          shaft_flex?: string | null;
          shaft_material?: string | null;
          serial_number?: string | null;
          condition?: ClubCondition;
          purchase_date?: string | null;
          estimated_value?: number | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      club_photos: {
        Row: {
          id: string;
          club_id: string;
          user_id: string;
          storage_path: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          user_id: string;
          storage_path: string;
          is_primary?: boolean;
        };
        Update: {
          is_primary?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      club_category: ClubCategory;
      club_condition: ClubCondition;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Bag = Database['public']['Tables']['bags']['Row'];
export type Club = Database['public']['Tables']['clubs']['Row'];
export type ClubPhoto = Database['public']['Tables']['club_photos']['Row'];
