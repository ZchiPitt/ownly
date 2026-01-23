/**
 * TypeScript types for Clekee database entities
 * Generated from Supabase schema migrations
 */

// ============================================
// Entity Interfaces - match database schema
// ============================================

/**
 * User profile extending auth.users
 * Table: profiles
 */
export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * User personalization preferences
 * Table: user_settings
 */
export interface UserSettings {
  id: string;
  user_id: string;
  reminder_enabled: boolean;
  reminder_threshold_days: number;
  expiration_reminder_days: number;
  push_notifications_enabled: boolean;
  default_view: 'gallery' | 'list';
  created_at: string;
  updated_at: string;
}

/**
 * Category for organizing inventory items
 * Table: categories
 */
export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  is_system: boolean;
  sort_order: number;
  created_at: string;
}

/**
 * Storage location with hierarchical support
 * Table: locations
 */
export interface Location {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  path: string;
  depth: number;
  icon: string;
  photo_url: string | null;
  item_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * AI metadata stored with items
 * Flexible JSON structure for AI analysis results
 */
export interface ItemAIMetadata {
  detected_name?: string;
  detected_category?: string;
  detected_tags?: string[];
  detected_brand?: string;
  confidence_score?: number;
  analysis_provider?: string;
  analysis_model?: string;
  analyzed_at?: string;
  [key: string]: unknown;
}

/**
 * Core inventory item
 * Table: items
 */
export interface Item {
  id: string;
  user_id: string;
  photo_url: string;
  thumbnail_url: string | null;
  name: string | null;
  description: string | null;
  category_id: string | null;
  tags: string[];
  location_id: string | null;
  quantity: number;
  price: number | null;
  currency: string;
  purchase_date: string | null;
  expiration_date: string | null;
  brand: string | null;
  model: string | null;
  notes: string | null;
  is_favorite: boolean;
  keep_forever: boolean;
  ai_metadata: ItemAIMetadata | null;
  embedding?: number[] | null; // vector(1536) - pgvector
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Notification type enum
 */
export type NotificationType = 'unused_item' | 'expiring_item' | 'system';

/**
 * User notification
 * Table: notifications
 */
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  item_id: string | null;
  is_read: boolean;
  is_pushed: boolean;
  pushed_at: string | null;
  created_at: string;
}

// ============================================
// Supabase Database Type Definition
// For use with createClient<Database>()
// ============================================

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at'>>;
      };
      user_settings: {
        Row: UserSettings;
        Insert: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          reminder_enabled?: boolean;
          reminder_threshold_days?: number;
          expiration_reminder_days?: number;
          push_notifications_enabled?: boolean;
          default_view?: 'gallery' | 'list';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at'> & {
          id?: string;
          icon?: string;
          color?: string;
          is_system?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Omit<Category, 'id' | 'user_id' | 'created_at' | 'is_system'>>;
      };
      locations: {
        Row: Location;
        Insert: Omit<Location, 'id' | 'path' | 'depth' | 'item_count' | 'created_at' | 'updated_at' | 'deleted_at'> & {
          id?: string;
          path?: string;
          depth?: number;
          icon?: string;
          item_count?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Omit<Location, 'id' | 'user_id' | 'created_at' | 'path' | 'depth' | 'item_count'>>;
      };
      items: {
        Row: Item;
        Insert: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & {
          id?: string;
          tags?: string[];
          quantity?: number;
          currency?: string;
          is_favorite?: boolean;
          keep_forever?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Omit<Item, 'id' | 'user_id' | 'created_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'> & {
          id?: string;
          is_read?: boolean;
          is_pushed?: boolean;
          created_at?: string;
        };
        Update: Partial<Omit<Notification, 'id' | 'user_id' | 'created_at' | 'type'>>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_similar_items: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
        };
        Returns: Array<{
          id: string;
          name: string | null;
          description: string | null;
          photo_url: string;
          thumbnail_url: string | null;
          category_id: string | null;
          location_id: string | null;
          similarity: number;
        }>;
      };
      search_items_by_embedding: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          search_user_id?: string | null;
        };
        Returns: Array<{
          id: string;
          name: string | null;
          description: string | null;
          photo_url: string;
          thumbnail_url: string | null;
          category_id: string | null;
          location_id: string | null;
          similarity: number;
        }>;
      };
    };
    Enums: {
      notification_type: NotificationType;
    };
  };
};

// ============================================
// Utility Types
// ============================================

/**
 * Extract row type from a table name
 */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/**
 * Extract insert type from a table name
 */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/**
 * Extract update type from a table name
 */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
