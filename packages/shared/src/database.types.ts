export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agent_metrics: {
        Row: {
          agent_id: string
          avg_confidence: number | null
          avg_feedback_score: number | null
          correction_rate: number | null
          created_at: string
          failed_runs: number
          id: string
          successful_runs: number
          total_runs: number
          trend: string | null
          week_ending: string
          workspace_id: string
        }
        Insert: {
          agent_id: string
          avg_confidence?: number | null
          avg_feedback_score?: number | null
          correction_rate?: number | null
          created_at?: string
          failed_runs?: number
          id?: string
          successful_runs?: number
          total_runs?: number
          trend?: string | null
          week_ending: string
          workspace_id: string
        }
        Update: {
          agent_id?: string
          avg_confidence?: number | null
          avg_feedback_score?: number | null
          correction_rate?: number | null
          created_at?: string
          failed_runs?: number
          id?: string
          successful_runs?: number
          total_runs?: number
          trend?: string | null
          week_ending?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_metrics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_metrics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          input_schema: Json | null
          model: string
          name: string
          schedule: string | null
          status: string
          system_prompt: string
          tier: number
          tools: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          input_schema?: Json | null
          model?: string
          name: string
          schedule?: string | null
          status?: string
          system_prompt: string
          tier?: number
          tools?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          input_schema?: Json | null
          model?: string
          name?: string
          schedule?: string | null
          status?: string
          system_prompt?: string
          tier?: number
          tools?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          candidate_id: string
          cover_letter: string | null
          created_at: string
          employer_notes: string | null
          id: string
          job_id: string
          match_score: number | null
          scoring_factors: Json | null
          status: string
          status_changed_at: string | null
          workspace_id: string
        }
        Insert: {
          candidate_id: string
          cover_letter?: string | null
          created_at?: string
          employer_notes?: string | null
          id?: string
          job_id: string
          match_score?: number | null
          scoring_factors?: Json | null
          status?: string
          status_changed_at?: string | null
          workspace_id: string
        }
        Update: {
          candidate_id?: string
          cover_letter?: string | null
          created_at?: string
          employer_notes?: string | null
          id?: string
          job_id?: string
          match_score?: number | null
          scoring_factors?: Json | null
          status?: string
          status_changed_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      board_task_audit: {
        Row: {
          action: string
          confidence: number | null
          created_at: string
          evidence_used: Json | null
          id: string
          new_value: string | null
          old_value: string | null
          performed_by: string
          task_id: string
          workspace_id: string
        }
        Insert: {
          action: string
          confidence?: number | null
          created_at?: string
          evidence_used?: Json | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by: string
          task_id: string
          workspace_id: string
        }
        Update: {
          action?: string
          confidence?: number | null
          created_at?: string
          evidence_used?: Json | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by?: string
          task_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_task_audit_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "board_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_task_audit_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      board_tasks: {
        Row: {
          assigned_to: string | null
          blocked_by: string | null
          board_id: string
          category: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          evidence: Json | null
          id: string
          notes: string | null
          priority: number | null
          status: string
          title: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          blocked_by?: string | null
          board_id: string
          category: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          evidence?: Json | null
          id?: string
          notes?: string | null
          priority?: number | null
          status?: string
          title: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          blocked_by?: string | null
          board_id?: string
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          evidence?: Json | null
          id?: string
          notes?: string | null
          priority?: number | null
          status?: string
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_tasks_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "board_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_tasks_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          country: string
          created_at: string
          domain: string | null
          id: string
          name: string
          readiness_score: Json | null
          region: string
          season_end_month: number | null
          season_start_month: number | null
          season_type: string | null
          seo_config: Json
          settings: Json
          slug: string
          status: string
          template_id: string | null
          workspace_id: string
        }
        Insert: {
          country: string
          created_at?: string
          domain?: string | null
          id?: string
          name: string
          readiness_score?: Json | null
          region: string
          season_end_month?: number | null
          season_start_month?: number | null
          season_type?: string | null
          seo_config?: Json
          settings?: Json
          slug: string
          status?: string
          template_id?: string | null
          workspace_id: string
        }
        Update: {
          country?: string
          created_at?: string
          domain?: string | null
          id?: string
          name?: string
          readiness_score?: Json | null
          region?: string
          season_end_month?: number | null
          season_start_month?: number | null
          season_type?: string | null
          seo_config?: Json
          settings?: Json
          slug?: string
          status?: string
          template_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          available_from: string | null
          available_to: string | null
          bio: string | null
          created_at: string
          email: string
          experience_categories: string[]
          first_name: string
          id: string
          languages: string[]
          last_name: string | null
          nationality: string | null
          phone: string | null
          preferred_regions: string[]
          profile_completeness: number
          resume_url: string | null
          returning_candidate: boolean
          seasons_completed: number
          skills: string[]
          source_board_id: string | null
          source_channel: string | null
          status: string
          updated_at: string
          visa_status: string | null
          workspace_id: string
        }
        Insert: {
          available_from?: string | null
          available_to?: string | null
          bio?: string | null
          created_at?: string
          email: string
          experience_categories?: string[]
          first_name: string
          id?: string
          languages?: string[]
          last_name?: string | null
          nationality?: string | null
          phone?: string | null
          preferred_regions?: string[]
          profile_completeness?: number
          resume_url?: string | null
          returning_candidate?: boolean
          seasons_completed?: number
          skills?: string[]
          source_board_id?: string | null
          source_channel?: string | null
          status?: string
          updated_at?: string
          visa_status?: string | null
          workspace_id: string
        }
        Update: {
          available_from?: string | null
          available_to?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          experience_categories?: string[]
          first_name?: string
          id?: string
          languages?: string[]
          last_name?: string | null
          nationality?: string | null
          phone?: string | null
          preferred_regions?: string[]
          profile_completeness?: number
          resume_url?: string | null
          returning_candidate?: boolean
          seasons_completed?: number
          skills?: string[]
          source_board_id?: string | null
          source_channel?: string | null
          status?: string
          updated_at?: string
          visa_status?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_source_board_id_fkey"
            columns: ["source_board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          board_id: string
          body: string | null
          created_at: string
          id: string
          performance: Json
          published_at: string | null
          seo_meta: Json
          slug: string | null
          status: string
          target_keyword: string | null
          title: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          board_id: string
          body?: string | null
          created_at?: string
          id?: string
          performance?: Json
          published_at?: string | null
          seo_meta?: Json
          slug?: string | null
          status?: string
          target_keyword?: string | null
          title: string
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          board_id?: string
          body?: string | null
          created_at?: string
          id?: string
          performance?: Json
          published_at?: string | null
          seo_meta?: Json
          slug?: string | null
          status?: string
          target_keyword?: string | null
          title?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_briefs: {
        Row: {
          id: string
          workspace_id: string
          date: string
          top_3: string[]
          completed_yesterday: string[]
          stale_missions: string[]
          venture_health: Json
          brief_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          date: string
          top_3?: string[]
          completed_yesterday?: string[]
          stale_missions?: string[]
          venture_health?: Json
          brief_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          date?: string
          top_3?: string[]
          completed_yesterday?: string[]
          stale_missions?: string[]
          venture_health?: Json
          brief_text?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_briefs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_leads: {
        Row: {
          board_id: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          current_hiring: boolean | null
          id: string
          industry: string | null
          instagram_handle: string | null
          last_contacted_at: string | null
          location: string | null
          next_follow_up_at: string | null
          notes: string | null
          outreach_status: string
          source: string | null
          updated_at: string
          website: string | null
          workspace_id: string
        }
        Insert: {
          board_id?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          current_hiring?: boolean | null
          id?: string
          industry?: string | null
          instagram_handle?: string | null
          last_contacted_at?: string | null
          location?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          outreach_status?: string
          source?: string | null
          updated_at?: string
          website?: string | null
          workspace_id: string
        }
        Update: {
          board_id?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          current_hiring?: boolean | null
          id?: string
          industry?: string | null
          instagram_handle?: string | null
          last_contacted_at?: string | null
          location?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          outreach_status?: string
          source?: string | null
          updated_at?: string
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_leads_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      employers: {
        Row: {
          board_id: string | null
          company_name: string
          company_size: string | null
          contact_email: string
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          industry: string | null
          instagram_handle: string | null
          location: string | null
          notes: string | null
          plan: string
          previous_seasons: number
          status: string
          updated_at: string
          user_id: string | null
          website: string | null
          workspace_id: string
        }
        Insert: {
          board_id?: string | null
          company_name: string
          company_size?: string | null
          contact_email: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          instagram_handle?: string | null
          location?: string | null
          notes?: string | null
          plan?: string
          previous_seasons?: number
          status?: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
          workspace_id: string
        }
        Update: {
          board_id?: string | null
          company_name?: string
          company_size?: string | null
          contact_email?: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          instagram_handle?: string | null
          location?: string | null
          notes?: string | null
          plan?: string
          previous_seasons?: number
          status?: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employers_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      improvement_suggestions: {
        Row: {
          agent_id: string
          created_at: string
          description: string | null
          estimated_impact: string | null
          id: string
          proposed_change: Json | null
          status: string
          suggestion_type: string
          title: string
          workspace_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          description?: string | null
          estimated_impact?: string | null
          id?: string
          proposed_change?: Json | null
          status?: string
          suggestion_type: string
          title: string
          workspace_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          description?: string | null
          estimated_impact?: string | null
          id?: string
          proposed_change?: Json | null
          status?: string
          suggestion_type?: string
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "improvement_suggestions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "improvement_suggestions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          accommodation_provided: boolean
          board_id: string
          created_at: string
          description: string | null
          employer_id: string
          end_date: string | null
          expires_at: string | null
          id: string
          location: string | null
          published_at: string | null
          requirements: Json
          salary_range: string | null
          season: string | null
          slots_filled: number
          slots_total: number
          start_date: string | null
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accommodation_provided?: boolean
          board_id: string
          created_at?: string
          description?: string | null
          employer_id: string
          end_date?: string | null
          expires_at?: string | null
          id?: string
          location?: string | null
          published_at?: string | null
          requirements?: Json
          salary_range?: string | null
          season?: string | null
          slots_filled?: number
          slots_total?: number
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accommodation_provided?: boolean
          board_id?: string
          created_at?: string
          description?: string | null
          employer_id?: string
          end_date?: string | null
          expires_at?: string | null
          id?: string
          location?: string | null
          published_at?: string | null
          requirements?: Json
          salary_range?: string | null
          season?: string | null
          slots_filled?: number
          slots_total?: number
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      market_opportunities: {
        Row: {
          analysis: string | null
          competition_level: string | null
          country: string
          created_at: string
          estimated_candidates_year_1: number | null
          estimated_employers: number | null
          existing_competitors: Json
          id: string
          recommended_domain: string | null
          region: string
          score: number | null
          search_volume_monthly: number | null
          season_type: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          analysis?: string | null
          competition_level?: string | null
          country: string
          created_at?: string
          estimated_candidates_year_1?: number | null
          estimated_employers?: number | null
          existing_competitors?: Json
          id?: string
          recommended_domain?: string | null
          region: string
          score?: number | null
          search_volume_monthly?: number | null
          season_type?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          analysis?: string | null
          competition_level?: string | null
          country?: string
          created_at?: string
          estimated_candidates_year_1?: number | null
          estimated_employers?: number | null
          existing_competitors?: Json
          id?: string
          recommended_domain?: string | null
          region?: string
          score?: number | null
          search_volume_monthly?: number | null
          season_type?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_opportunities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          id: string
          workspace_id: string
          title: string
          description: string | null
          venture: string
          status: string
          rank: number | null
          urgency_score: number | null
          impact_score: number | null
          composite_score: number | null
          deadline: string | null
          blocked_by: string | null
          claude_context: string | null
          output_url: string | null
          created_at: string
          started_at: string | null
          completed_at: string | null
          last_touched: string
          stale_flag: boolean
          notes: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          title: string
          description?: string | null
          venture: string
          status?: string
          rank?: number | null
          urgency_score?: number | null
          impact_score?: number | null
          deadline?: string | null
          blocked_by?: string | null
          claude_context?: string | null
          output_url?: string | null
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
          last_touched?: string
          stale_flag?: boolean
          notes?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          title?: string
          description?: string | null
          venture?: string
          status?: string
          rank?: number | null
          urgency_score?: number | null
          impact_score?: number | null
          deadline?: string | null
          blocked_by?: string | null
          claude_context?: string | null
          output_url?: string | null
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
          last_touched?: string
          stale_flag?: boolean
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_taken: string | null
          actioned: boolean
          agent_id: string | null
          created_at: string
          id: string
          payload: Json | null
          read: boolean
          run_id: string | null
          title: string
          type: string
          workspace_id: string
        }
        Insert: {
          action_taken?: string | null
          actioned?: boolean
          agent_id?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          read?: boolean
          run_id?: string | null
          title: string
          type: string
          workspace_id: string
        }
        Update: {
          action_taken?: string | null
          actioned?: boolean
          agent_id?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          read?: boolean
          run_id?: string | null
          title?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          agent_id: string
          change_note: string | null
          created_at: string
          created_by: string
          id: string
          performance_score: number | null
          status: string
          system_prompt: string
          version_number: number
          workspace_id: string
        }
        Insert: {
          agent_id: string
          change_note?: string | null
          created_at?: string
          created_by?: string
          id?: string
          performance_score?: number | null
          status?: string
          system_prompt: string
          version_number: number
          workspace_id: string
        }
        Update: {
          agent_id?: string
          change_note?: string | null
          created_at?: string
          created_by?: string
          id?: string
          performance_score?: number | null
          status?: string
          system_prompt?: string
          version_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      run_feedback: {
        Row: {
          agent_id: string
          correction_diff: Json | null
          created_at: string
          feedback_note: string | null
          feedback_type: string
          id: string
          run_id: string
          workspace_id: string
        }
        Insert: {
          agent_id: string
          correction_diff?: Json | null
          created_at?: string
          feedback_note?: string | null
          feedback_type: string
          id?: string
          run_id: string
          workspace_id: string
        }
        Update: {
          agent_id?: string
          correction_diff?: Json | null
          created_at?: string
          feedback_note?: string | null
          feedback_type?: string
          id?: string
          run_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_feedback_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_feedback_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_feedback_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      runs: {
        Row: {
          agent_id: string | null
          completed_at: string | null
          cost_usd: number | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          input: Json | null
          metadata: Json | null
          output: Json | null
          reviewed: boolean
          status: string
          token_count: number | null
          triggered_by: string | null
          workflow_id: string | null
          workspace_id: string
        }
        Insert: {
          agent_id?: string | null
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json | null
          metadata?: Json | null
          output?: Json | null
          reviewed?: boolean
          status?: string
          token_count?: number | null
          triggered_by?: string | null
          workflow_id?: string | null
          workspace_id: string
        }
        Update: {
          agent_id?: string | null
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json | null
          metadata?: Json | null
          output?: Json | null
          reviewed?: boolean
          status?: string
          token_count?: number | null
          triggered_by?: string | null
          workflow_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      secrets: {
        Row: {
          created_at: string
          encrypted_value: string
          id: string
          key: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          encrypted_value: string
          id?: string
          key: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          encrypted_value?: string
          id?: string
          key?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secrets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          auth_method: string | null
          config: Json
          created_at: string
          id: string
          name: string
          rate_limit: Json | null
          status: string
          tier: number
          type: string
          workspace_id: string
        }
        Insert: {
          auth_method?: string | null
          config?: Json
          created_at?: string
          id?: string
          name: string
          rate_limit?: Json | null
          status?: string
          tier?: number
          type: string
          workspace_id: string
        }
        Update: {
          auth_method?: string | null
          config?: Json
          created_at?: string
          id?: string
          name?: string
          rate_limit?: Json | null
          status?: string
          tier?: number
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tools_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          steps: Json
          trigger: Json | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          steps?: Json
          trigger?: Json | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          steps?: Json
          trigger?: Json | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          settings: Json
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          settings?: Json
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          settings?: Json
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_workspace_role: {
        Args: { required_role: string; ws_id: string }
        Returns: boolean
      }
      is_workspace_member: { Args: { ws_id: string }; Returns: boolean }
      rerank_missions: { Args: { ws_id: string }; Returns: undefined }
      trigger_agent: { Args: { agent_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
