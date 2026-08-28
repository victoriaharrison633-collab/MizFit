/**
 * Supabase generated types.
 *
 * Placeholder — Prompt 3 owns the schema and fills this file with the output of
 * `supabase gen types typescript`. Nothing in Prompt 2a depends on the concrete
 * shape, so the Supabase clients are generic over `Database` and resolve to
 * loose typing until then.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
