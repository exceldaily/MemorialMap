/**
 * Hand-maintained types for the `memorial` Postgres schema.
 * Keep in sync with the Supabase migrations (memorial_0001 … 0006).
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type PrivacyLevel = "public" | "unlisted" | "private";
export type MemorialStatus = "draft" | "published" | "suspended" | "removed";
export type MemorialType = "deceased" | "living";
export type MemorialRole = "owner" | "administrator" | "contributor";
export type ModerationStatus = "pending" | "approved" | "hidden" | "deleted";
export type TributeType = "remembering" | "flower" | "candle" | "thinking";
export type RelationshipType = "parent" | "child" | "spouse" | "sibling" | "grandparent" | "grandchild" | "other";
export type FamilyMemberRole = "owner" | "member";
export type ReportReason =
  | "spam"
  | "impersonation"
  | "harassment"
  | "inappropriate_content"
  | "incorrect_information"
  | "copyright"
  | "privacy"
  | "other";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type BlockedAreaType = "point_radius" | "polygon";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "expired";

export type Profile = {
  id: string;
  display_name: string;
  avatar_path: string | null;
  bio: string | null;
  is_admin: boolean;
  is_blocked: boolean;
  blocked_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type Memorial = {
  id: string;
  slug: string;
  owner_id: string;
  family_group_id: string | null;
  memorial_type: MemorialType;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  nickname: string | null;
  full_name: string;
  birth_date: string | null;
  birth_year: number | null;
  birth_unknown: boolean;
  death_date: string | null;
  death_year: number | null;
  death_unknown: boolean;
  epitaph: string;
  biography: string | null;
  known_for: string | null;
  loved: string | null;
  made_them_laugh: string | null;
  remember_them_for: string | null;
  profile_image_path: string | null;
  cover_image_path: string | null;
  accent_color: string | null;
  appearance: Json;
  resting_place: string | null;
  privacy: PrivacyLevel;
  status: MemorialStatus;
  suspended_reason: string | null;
  view_count: number;
  memories_count: number;
  tributes_count: number;
  photos_count: number;
  is_demo: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MemorialLocation = {
  id: string;
  memorial_id: string;
  latitude: number;
  longitude: number;
  place_name: string | null;
  spacing_meters: number | null;
  created_at: string;
  updated_at: string;
}

export type MemorialAdmin = {
  id: string;
  memorial_id: string;
  user_id: string;
  role: MemorialRole;
  invited_by: string | null;
  created_at: string;
}

export type MemorialPhoto = {
  id: string;
  memorial_id: string;
  uploaded_by: string | null;
  storage_path: string;
  caption: string | null;
  year: number | null;
  location: string | null;
  people_shown: string | null;
  width: number | null;
  height: number | null;
  byte_size: number | null;
  sort_order: number;
  status: ModerationStatus;
  created_at: string;
  updated_at: string;
}

export type MemorialVideo = {
  id: string;
  memorial_id: string;
  uploaded_by: string | null;
  storage_path: string | null;
  external_url: string | null;
  title: string | null;
  description: string | null;
  duration_seconds: number | null;
  byte_size: number | null;
  sort_order: number;
  status: ModerationStatus;
  created_at: string;
  updated_at: string;
}

export type Memory = {
  id: string;
  memorial_id: string;
  author_id: string;
  relationship: string | null;
  body: string;
  photo_path: string | null;
  status: ModerationStatus;
  moderated_by: string | null;
  moderated_at: string | null;
  created_at: string;
  updated_at: string;
}

export type Tribute = {
  id: string;
  memorial_id: string;
  tribute_type: TributeType;
  user_id: string | null;
  visitor_key: string | null;
  actor_key: string;
  created_at: string;
  created_day: string;
}

export type TimelineEvent = {
  id: string;
  memorial_id: string;
  year: number;
  event_date: string | null;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type FamilyRelationship = {
  id: string;
  memorial_id: string;
  related_memorial_id: string;
  relationship_type: RelationshipType;
  label: string | null;
  created_by: string | null;
  created_at: string;
}

export type FamilyGroup = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_path: string | null;
  owner_id: string;
  privacy: PrivacyLevel;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export type FamilyGroupMember = {
  id: string;
  family_group_id: string;
  user_id: string;
  role: FamilyMemberRole;
  created_at: string;
}

export type SavedMemorial = {
  user_id: string;
  memorial_id: string;
  created_at: string;
}

export type Report = {
  id: string;
  memorial_id: string | null;
  memory_id: string | null;
  photo_id: string | null;
  reporter_id: string | null;
  reporter_email: string | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_note: string | null;
  created_at: string;
}

export type BlockedGeographicArea = {
  id: string;
  name: string;
  reason: string | null;
  area_type: BlockedAreaType;
  center: unknown;
  radius_meters: number | null;
  polygon: unknown;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ActivityLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Json;
  created_at: string;
}

export type Plan = {
  code: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  billing_interval: string | null;
  limits: Json;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type Subscription = {
  id: string;
  user_id: string;
  plan_code: string;
  status: SubscriptionStatus;
  provider: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export type Setting = {
  key: string;
  value: Json;
  description: string | null;
  updated_at: string;
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

/* ---- RPC result shapes ------------------------------------------------- */

export type CheckLocationResult = {
  available: boolean;
  reason: "available" | "reserved" | "blocked_area" | "invalid_coordinates" | "claimed";
  message: string;
  nearest_distance_meters?: number;
  required_spacing_meters?: number;
  suggestions?: { latitude: number; longitude: number }[];
  blocked_area?: { id: string; name: string };
  location?: { id: string; memorial_id: string; latitude: number; longitude: number; place_name: string | null };
}

export type MapFeatureMemorial = {
  kind: "memorial";
  id: string;
  slug: string;
  name: string;
  birth_year: number | null;
  death_year: number | null;
  epitaph: string | null;
  profile_image_path: string | null;
  family_group_id: string | null;
  is_demo: boolean;
  memorial_type: MemorialType;
}
export type MapFeatureCluster = {
  kind: "cluster";
  count: number;
  cell: string;
}
export type MapFeature = {
  type: "Feature";
  id?: string;
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: MapFeatureMemorial | MapFeatureCluster;
}
export type MapFeatureCollection = {
  type: "FeatureCollection";
  features: MapFeature[];
  mode: "clusters" | "points";
  total: number;
  truncated?: boolean;
}

export type SearchResult = {
  id: string;
  slug: string;
  full_name: string;
  nickname: string | null;
  birth_year: number | null;
  death_year: number | null;
  epitaph: string | null;
  profile_image_path: string | null;
  cover_image_path: string | null;
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
  tributes_count: number;
  memories_count: number;
  rank: number;
}

export type FamilyOfRow = {
  relationship_id: string;
  relationship_type: RelationshipType;
  label: string | null;
  direction: string;
  id: string;
  slug: string;
  full_name: string;
  birth_year: number | null;
  death_year: number | null;
  profile_image_path: string | null;
  privacy: PrivacyLevel;
  status: MemorialStatus;
}

export type NearbyMemorial = {
  id: string;
  slug: string;
  full_name: string;
  birth_year: number | null;
  death_year: number | null;
  epitaph: string | null;
  profile_image_path: string | null;
  latitude: number;
  longitude: number;
  distance_meters: number;
  family_group_id: string | null;
}

export type DashboardMemorial = {
  id: string;
  slug: string;
  full_name: string;
  birth_year: number | null;
  death_year: number | null;
  profile_image_path: string | null;
  cover_image_path: string | null;
  privacy: PrivacyLevel;
  status: MemorialStatus;
  view_count: number;
  memories_count: number;
  tributes_count: number;
  photos_count: number;
  updated_at: string;
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
  role: MemorialRole;
  pending_memories: number;
}
export type DashboardFamilyGroup = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  memorial_count: number;
}
export type DashboardPendingMemory = {
  id: string;
  body: string;
  relationship: string | null;
  photo_path: string | null;
  created_at: string;
  memorial_id: string;
  slug: string;
  full_name: string;
  author_name: string | null;
}
export type DashboardSaved = {
  id: string;
  slug: string;
  full_name: string;
  birth_year: number | null;
  death_year: number | null;
  profile_image_path: string | null;
  epitaph: string | null;
  place_name: string | null;
  saved_at: string;
}
export type DashboardData = {
  plan: string;
  limits: Record<string, Json>;
  memorials: DashboardMemorial[];
  family_groups: DashboardFamilyGroup[];
  pending_memories: DashboardPendingMemory[];
  saved: DashboardSaved[];
}

export type AdminStats = {
  users: number;
  memorials: number;
  published: number;
  suspended: number;
  open_reports: number;
  pending_memories: number;
  photos: number;
  blocked_areas: number;
  family_groups: number;
}

export type CreateMemorialInput = {
  memorial_type?: MemorialType;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  nickname?: string | null;
  birth_date?: string | null;
  birth_year?: number | null;
  birth_unknown?: boolean;
  death_date?: string | null;
  death_year?: number | null;
  death_unknown?: boolean;
  epitaph?: string | null;
  biography?: string | null;
  known_for?: string | null;
  loved?: string | null;
  made_them_laugh?: string | null;
  remember_them_for?: string | null;
  profile_image_path?: string | null;
  cover_image_path?: string | null;
  resting_place?: string | null;
  privacy?: PrivacyLevel;
  family_group_id?: string | null;
}

/* ---- Database definition (memorial schema) ----------------------------- */

export type Database = {
  memorial: {
    Tables: {
      profiles: Table<Profile>;
      memorials: Table<Memorial>;
      memorial_locations: Table<MemorialLocation>;
      memorial_admins: Table<MemorialAdmin>;
      memorial_photos: Table<MemorialPhoto>;
      memorial_videos: Table<MemorialVideo>;
      memories: Table<Memory>;
      tributes: Table<Tribute>;
      timeline_events: Table<TimelineEvent>;
      family_relationships: Table<FamilyRelationship>;
      family_groups: Table<FamilyGroup>;
      family_group_members: Table<FamilyGroupMember>;
      saved_memorials: Table<SavedMemorial>;
      reports: Table<Report>;
      blocked_geographic_areas: Table<BlockedGeographicArea>;
      activity_logs: Table<ActivityLog>;
      plans: Table<Plan>;
      subscriptions: Table<Subscription>;
      settings: Table<Setting>;
    };
    Views: Record<string, never>;
    Functions: {
      add_tribute: {
        Args: { p_memorial_id: string; p_type: TributeType; p_visitor_key?: string | null };
        Returns: { added: boolean; counts: Record<string, number> };
      };
      admin_block_area: {
        Args: { p_name: string; p_reason: string | null; p_latitude: number; p_longitude: number; p_radius_meters: number };
        Returns: string;
      };
      admin_block_polygon: { Args: { p_name: string; p_reason: string | null; p_geojson: Json }; Returns: string };
      admin_resolve_report: { Args: { p_report_id: string; p_status: ReportStatus; p_note?: string | null }; Returns: undefined };
      admin_set_memorial_status: { Args: { p_memorial_id: string; p_status: MemorialStatus; p_reason?: string | null }; Returns: undefined };
      admin_set_user_blocked: { Args: { p_user_id: string; p_blocked: boolean; p_reason?: string | null }; Returns: undefined };
      admin_stats: { Args: Record<string, never>; Returns: AdminStats | null };
      can_contribute: { Args: { p_memorial_id: string }; Returns: boolean };
      can_manage: { Args: { p_memorial_id: string }; Returns: boolean };
      can_manage_family_group: { Args: { p_group_id: string }; Returns: boolean };
      can_view: { Args: { p_memorial_id: string }; Returns: boolean };
      check_location: {
        Args: { p_latitude: number; p_longitude: number; p_family_group_id?: string | null; p_exclude_memorial_id?: string | null };
        Returns: CheckLocationResult;
      };
      claim_location: {
        Args: { p_memorial_id: string; p_latitude: number; p_longitude: number; p_place_name?: string | null };
        Returns: CheckLocationResult;
      };
      create_memorial: { Args: { p_input: CreateMemorialInput }; Returns: Memorial };
      ensure_profile: { Args: Record<string, never>; Returns: Profile };
      family_group_role: { Args: { p_group_id: string }; Returns: FamilyMemberRole | null };
      family_of: { Args: { p_memorial_id: string }; Returns: FamilyOfRow[] };
      increment_view: { Args: { p_slug: string }; Returns: undefined };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_owner: { Args: { p_memorial_id: string }; Returns: boolean };
      log_activity: { Args: { p_action: string; p_entity_type: string; p_entity_id: string | null; p_metadata?: Json }; Returns: undefined };
      memorials_in_bounds: {
        Args: { p_min_lng: number; p_min_lat: number; p_max_lng: number; p_max_lat: number; p_zoom?: number; p_limit?: number | null };
        Returns: MapFeatureCollection;
      };
      memorials_near: {
        Args: { p_latitude: number; p_longitude: number; p_radius_meters?: number; p_limit?: number };
        Returns: NearbyMemorial[];
      };
      my_dashboard: { Args: Record<string, never>; Returns: DashboardData };
      plan_limits: { Args: { p_user_id?: string }; Returns: Record<string, Json> };
      publish_memorial: { Args: { p_memorial_id: string }; Returns: Memorial };
      role_for: { Args: { p_memorial_id: string }; Returns: MemorialRole | null };
      search_memorials: {
        Args: { p_query?: string | null; p_birth_year?: number | null; p_death_year?: number | null; p_limit?: number; p_offset?: number };
        Returns: SearchResult[];
      };
      tribute_counts: { Args: { p_memorial_id: string }; Returns: Record<string, number> };
      user_plan: { Args: { p_user_id?: string }; Returns: string };
    };
    Enums: {
      privacy_level: PrivacyLevel;
      memorial_status: MemorialStatus;
      memorial_type: MemorialType;
      memorial_role: MemorialRole;
      moderation_status: ModerationStatus;
      tribute_type: TributeType;
      relationship_type: RelationshipType;
      family_member_role: FamilyMemberRole;
      report_reason: ReportReason;
      report_status: ReportStatus;
      blocked_area_type: BlockedAreaType;
      subscription_status: SubscriptionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
