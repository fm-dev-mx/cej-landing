export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string;
          freight_tax: string | null;
          freight_vat_rate: number | null;
          id: string;
          name: string;
          profile_verified: boolean;
          quote_profile: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          freight_tax?: string | null;
          freight_vat_rate?: number | null;
          id?: string;
          name: string;
          profile_verified?: boolean;
          quote_profile?: NonNullable<Json>;
        };
        Update: {
          created_at?: string;
          freight_tax?: string | null;
          freight_vat_rate?: number | null;
          id?: string;
          name?: string;
          profile_verified?: boolean;
          quote_profile?: NonNullable<Json>;
        };
        Relationships: [];
      };
      company_memberships: {
        Row: {
          active: boolean;
          company_id: string;
          role: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          company_id: string;
          role: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          company_id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_memberships_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      company_websites: {
        Row: {
          company_id: string;
          enabled: boolean;
          hostname: string;
        };
        ComputedFields: never;
        Insert: {
          company_id: string;
          enabled?: boolean;
          hostname: string;
        };
        Update: {
          company_id?: string;
          enabled?: boolean;
          hostname?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_websites_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_identities: {
        Row: {
          company_id: string | null;
          created_at: string;
          customer_id: string;
          id: string;
          is_primary: boolean;
          type: string;
          updated_at: string;
          value_norm: string;
          verified_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          company_id?: string | null;
          created_at?: string;
          customer_id: string;
          id?: string;
          is_primary?: boolean;
          type: string;
          updated_at?: string;
          value_norm: string;
          verified_at?: string | null;
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          customer_id?: string;
          id?: string;
          is_primary?: boolean;
          type?: string;
          updated_at?: string;
          value_norm?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customer_identities_company_id_customer_id_fkey";
            columns: ["company_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "customer_identities_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_identities_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_merge_log: {
        Row: {
          company_id: string | null;
          id: string;
          merged_at: string;
          merged_by: string | null;
          merged_customer_id: string;
          reason: string | null;
          survivor_customer_id: string;
        };
        ComputedFields: never;
        Insert: {
          company_id?: string | null;
          id?: string;
          merged_at?: string;
          merged_by?: string | null;
          merged_customer_id: string;
          reason?: string | null;
          survivor_customer_id: string;
        };
        Update: {
          company_id?: string | null;
          id?: string;
          merged_at?: string;
          merged_by?: string | null;
          merged_customer_id?: string;
          reason?: string | null;
          survivor_customer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_merge_log_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_merge_log_merged_by_fkey";
            columns: ["merged_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_merge_log_merged_customer_id_fkey";
            columns: ["merged_customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_merge_log_survivor_customer_id_fkey";
            columns: ["survivor_customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          company_id: string | null;
          created_at: string;
          display_name: string;
          id: string;
          identity_status: string;
          merged_into_customer_id: string | null;
          primary_email_norm: string | null;
          primary_phone_norm: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          company_id?: string | null;
          created_at?: string;
          display_name: string;
          id?: string;
          identity_status?: string;
          merged_into_customer_id?: string | null;
          primary_email_norm?: string | null;
          primary_phone_norm?: string | null;
          updated_at?: string;
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          identity_status?: string;
          merged_into_customer_id?: string | null;
          primary_email_norm?: string | null;
          primary_phone_norm?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customers_merged_into_customer_id_fkey";
            columns: ["merged_into_customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          amount: number;
          category: string;
          company_id: string | null;
          created_at: string;
          currency: string;
          expense_date: string;
          id: string;
          notes: string | null;
          reference: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          category: string;
          company_id?: string | null;
          created_at?: string;
          currency?: string;
          expense_date: string;
          id?: string;
          notes?: string | null;
          reference?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category?: string;
          company_id?: string | null;
          created_at?: string;
          currency?: string;
          expense_date?: string;
          id?: string;
          notes?: string | null;
          reference?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      followups: {
        Row: {
          action: string;
          company_id: string;
          completed_at: string | null;
          customer_id: string;
          due_at: string;
          id: string;
          previous_id: string | null;
          project_id: string | null;
          responsible_id: string;
          result: string | null;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          company_id: string;
          completed_at?: string | null;
          customer_id: string;
          due_at: string;
          id?: string;
          previous_id?: string | null;
          project_id?: string | null;
          responsible_id: string;
          result?: string | null;
          version?: number;
        };
        Update: {
          action?: string;
          company_id?: string;
          completed_at?: string | null;
          customer_id?: string;
          due_at?: string;
          id?: string;
          previous_id?: string | null;
          project_id?: string | null;
          responsible_id?: string;
          result?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "followups_company_id_customer_id_fkey";
            columns: ["company_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "followups_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "followups_company_id_previous_id_fkey";
            columns: ["company_id", "previous_id"];
            isOneToOne: false;
            referencedRelation: "followup_queue";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "followups_company_id_previous_id_fkey";
            columns: ["company_id", "previous_id"];
            isOneToOne: false;
            referencedRelation: "followups";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "followups_company_id_project_id_customer_id_fkey";
            columns: ["company_id", "project_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["company_id", "id", "customer_id"];
          },
        ];
      };
      import_rows: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string;
          file_hash: string;
          hidden: boolean;
          id: string;
          issues: NonNullable<Json>;
          mapped: Json | null;
          order_id: string | null;
          raw: NonNullable<Json>;
          row_hash: string;
          row_number: number;
          sheet: string;
          sheet_state: string;
          source_name: string;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          company_id: string;
          created_at?: string;
          created_by: string;
          file_hash: string;
          hidden: boolean;
          id?: string;
          issues?: NonNullable<Json>;
          mapped?: Json | null;
          order_id?: string | null;
          raw: NonNullable<Json>;
          row_hash: string;
          row_number: number;
          sheet: string;
          sheet_state: string;
          source_name: string;
          status?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string;
          file_hash?: string;
          hidden?: boolean;
          id?: string;
          issues?: NonNullable<Json>;
          mapped?: Json | null;
          order_id?: string | null;
          raw?: NonNullable<Json>;
          row_hash?: string;
          row_number?: number;
          sheet?: string;
          sheet_state?: string;
          source_name?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "import_rows_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "import_rows_company_id_order_id_fkey";
            columns: ["company_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      leads: {
        Row: {
          captured_by: string | null;
          company_id: string | null;
          created_at: string;
          customer_id: string | null;
          customer_source: string | null;
          delivery_address: string | null;
          delivery_date: string | null;
          fb_event_id: string | null;
          fbclid: string | null;
          gclid: string | null;
          id: number;
          lost_reason: string | null;
          name: string;
          notes: string | null;
          occurred_at: string | null;
          phone: string;
          phone_norm: string | null;
          privacy_accepted: boolean;
          privacy_accepted_at: string | null;
          quote_data: NonNullable<Json>;
          source_channel: string | null;
          status: Database["public"]["Enums"]["lead_status_enum"];
          updated_at: string;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_medium: string | null;
          utm_source: string | null;
          utm_term: string | null;
          visitor_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          captured_by?: string | null;
          company_id?: string | null;
          created_at?: string;
          customer_id?: string | null;
          customer_source?: string | null;
          delivery_address?: string | null;
          delivery_date?: string | null;
          fb_event_id?: string | null;
          fbclid?: string | null;
          gclid?: string | null;
          id?: number;
          lost_reason?: string | null;
          name: string;
          notes?: string | null;
          occurred_at?: string | null;
          phone: string;
          phone_norm?: string | null;
          privacy_accepted?: boolean;
          privacy_accepted_at?: string | null;
          quote_data: NonNullable<Json>;
          source_channel?: string | null;
          status?: Database["public"]["Enums"]["lead_status_enum"];
          updated_at?: string;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
          visitor_id?: string | null;
        };
        Update: {
          captured_by?: string | null;
          company_id?: string | null;
          created_at?: string;
          customer_id?: string | null;
          customer_source?: string | null;
          delivery_address?: string | null;
          delivery_date?: string | null;
          fb_event_id?: string | null;
          fbclid?: string | null;
          gclid?: string | null;
          id?: number;
          lost_reason?: string | null;
          name?: string;
          notes?: string | null;
          occurred_at?: string | null;
          phone?: string;
          phone_norm?: string | null;
          privacy_accepted?: boolean;
          privacy_accepted_at?: string | null;
          quote_data?: NonNullable<Json>;
          source_channel?: string | null;
          status?: Database["public"]["Enums"]["lead_status_enum"];
          updated_at?: string;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
          visitor_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_customer_company";
            columns: ["company_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "leads_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      legacy_ingest_batches: {
        Row: {
          company_id: string | null;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          error_count: number;
          file_sha256: string | null;
          id: string;
          metadata_json: NonNullable<Json>;
          row_count: number;
          source_file: string;
          source_name: string;
          started_at: string;
          status: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          company_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error_count?: number;
          file_sha256?: string | null;
          id?: string;
          metadata_json?: NonNullable<Json>;
          row_count?: number;
          source_file: string;
          source_name: string;
          started_at?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error_count?: number;
          file_sha256?: string | null;
          id?: string;
          metadata_json?: NonNullable<Json>;
          row_count?: number;
          source_file?: string;
          source_name?: string;
          started_at?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "legacy_ingest_batches_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "legacy_ingest_batches_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      legacy_row_rejections: {
        Row: {
          company_id: string | null;
          created_at: string;
          id: string;
          ingest_batch_id: string | null;
          raw_payload_json: NonNullable<Json>;
          reason_code: string;
          reason_detail: string | null;
          row_hash: string | null;
          row_number: number;
          source_name: string;
        };
        ComputedFields: never;
        Insert: {
          company_id?: string | null;
          created_at?: string;
          id?: string;
          ingest_batch_id?: string | null;
          raw_payload_json: NonNullable<Json>;
          reason_code: string;
          reason_detail?: string | null;
          row_hash?: string | null;
          row_number: number;
          source_name: string;
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          id?: string;
          ingest_batch_id?: string | null;
          raw_payload_json?: NonNullable<Json>;
          reason_code?: string;
          reason_detail?: string | null;
          row_hash?: string | null;
          row_number?: number;
          source_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "legacy_row_rejections_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "legacy_row_rejections_ingest_batch_id_fkey";
            columns: ["ingest_batch_id"];
            isOneToOne: false;
            referencedRelation: "legacy_ingest_batches";
            referencedColumns: ["id"];
          },
        ];
      };
      marketing_destinations: {
        Row: {
          api_version: string | null;
          company_id: string;
          dataset_id: string | null;
          enabled: boolean;
          test_only: boolean;
          verified: boolean;
        };
        ComputedFields: never;
        Insert: {
          api_version?: string | null;
          company_id: string;
          dataset_id?: string | null;
          enabled?: boolean;
          test_only?: boolean;
          verified?: boolean;
        };
        Update: {
          api_version?: string | null;
          company_id?: string;
          dataset_id?: string | null;
          enabled?: boolean;
          test_only?: boolean;
          verified?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "marketing_destinations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: true;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      marketing_outbox: {
        Row: {
          api_receipt: Json | null;
          attempts: number;
          company_id: string;
          event_id: string;
          event_name: string;
          fact_id: string;
          id: string;
          last_error: string | null;
          leased_until: string | null;
          next_attempt_at: string;
          occurred_at: string;
          payload: Json | null;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          api_receipt?: Json | null;
          attempts?: number;
          company_id: string;
          event_id: string;
          event_name: string;
          fact_id: string;
          id?: string;
          last_error?: string | null;
          leased_until?: string | null;
          next_attempt_at?: string;
          occurred_at: string;
          payload?: Json | null;
          status?: string;
        };
        Update: {
          api_receipt?: Json | null;
          attempts?: number;
          company_id?: string;
          event_id?: string;
          event_name?: string;
          fact_id?: string;
          id?: string;
          last_error?: string | null;
          leased_until?: string | null;
          next_attempt_at?: string;
          occurred_at?: string;
          payload?: Json | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketing_outbox_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      membership_history: {
        Row: {
          active: boolean;
          actor_id: string;
          changed_at: string;
          company_id: string;
          id: string;
          reason: string;
          role: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          active: boolean;
          actor_id: string;
          changed_at?: string;
          company_id: string;
          id?: string;
          reason: string;
          role: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          actor_id?: string;
          changed_at?: string;
          company_id?: string;
          id?: string;
          reason?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "membership_history_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      order_fiscal_data: {
        Row: {
          cfdi_use: string | null;
          company_id: string | null;
          created_at: string;
          invoice_number: string | null;
          invoice_requested_at: string | null;
          order_id: string;
          razon_social: string | null;
          requires_invoice: boolean;
          rfc: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          cfdi_use?: string | null;
          company_id?: string | null;
          created_at?: string;
          invoice_number?: string | null;
          invoice_requested_at?: string | null;
          order_id: string;
          razon_social?: string | null;
          requires_invoice?: boolean;
          rfc?: string | null;
          updated_at?: string;
        };
        Update: {
          cfdi_use?: string | null;
          company_id?: string | null;
          created_at?: string;
          invoice_number?: string | null;
          invoice_requested_at?: string | null;
          order_id?: string;
          razon_social?: string | null;
          requires_invoice?: boolean;
          rfc?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_fiscal_data_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_fiscal_data_company_id_order_id_fkey";
            columns: ["company_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "order_fiscal_data_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_import_log: {
        Row: {
          company_id: string | null;
          created_at: string;
          import_batch_id: string | null;
          import_row_hash: string | null;
          import_source: string | null;
          legacy_folio_raw: string | null;
          order_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          company_id?: string | null;
          created_at?: string;
          import_batch_id?: string | null;
          import_row_hash?: string | null;
          import_source?: string | null;
          legacy_folio_raw?: string | null;
          order_id: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          import_batch_id?: string | null;
          import_row_hash?: string | null;
          import_source?: string | null;
          legacy_folio_raw?: string | null;
          order_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_import_log_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_import_log_company_id_order_id_fkey";
            columns: ["company_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "order_import_log_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_payments: {
        Row: {
          amount_mxn: number;
          company_id: string | null;
          created_at: string;
          created_by: string | null;
          direction: Database["public"]["Enums"]["payment_direction_enum"];
          id: string;
          kind: Database["public"]["Enums"]["payment_kind_enum"];
          method: Database["public"]["Enums"]["payment_method_enum"];
          notes: string | null;
          order_id: string;
          paid_at: string;
          receipt_number: string | null;
          reference: string | null;
          updated_at: string;
          void_reason: string | null;
          voided_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          amount_mxn: number;
          company_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          direction: Database["public"]["Enums"]["payment_direction_enum"];
          id?: string;
          kind: Database["public"]["Enums"]["payment_kind_enum"];
          method: Database["public"]["Enums"]["payment_method_enum"];
          notes?: string | null;
          order_id: string;
          paid_at?: string;
          receipt_number?: string | null;
          reference?: string | null;
          updated_at?: string;
          void_reason?: string | null;
          voided_at?: string | null;
        };
        Update: {
          amount_mxn?: number;
          company_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          direction?: Database["public"]["Enums"]["payment_direction_enum"];
          id?: string;
          kind?: Database["public"]["Enums"]["payment_kind_enum"];
          method?: Database["public"]["Enums"]["payment_method_enum"];
          notes?: string | null;
          order_id?: string;
          paid_at?: string;
          receipt_number?: string | null;
          reference?: string | null;
          updated_at?: string;
          void_reason?: string | null;
          voided_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_payments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_payments_company_id_order_id_fkey";
            columns: ["company_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "order_payments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          changed_at: string;
          changed_by: string | null;
          company_id: string | null;
          from_status: Database["public"]["Enums"]["order_status_enum"] | null;
          id: string;
          order_id: string;
          reason: string | null;
          to_status: Database["public"]["Enums"]["order_status_enum"];
        };
        ComputedFields: never;
        Insert: {
          changed_at?: string;
          changed_by?: string | null;
          company_id?: string | null;
          from_status?: Database["public"]["Enums"]["order_status_enum"] | null;
          id?: string;
          order_id: string;
          reason?: string | null;
          to_status: Database["public"]["Enums"]["order_status_enum"];
        };
        Update: {
          changed_at?: string;
          changed_by?: string | null;
          company_id?: string | null;
          from_status?: Database["public"]["Enums"]["order_status_enum"] | null;
          id?: string;
          order_id?: string;
          reason?: string | null;
          to_status?: Database["public"]["Enums"]["order_status_enum"];
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_status_history_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_status_history_company_id_order_id_fkey";
            columns: ["company_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          attribution_extra_json: NonNullable<Json>;
          balance_amount: number;
          company_id: string | null;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          customer_accepted_at: string | null;
          customer_id: string | null;
          delivery_address_id: string | null;
          delivery_address_text: string | null;
          external_ref: string | null;
          fb_event_id: string | null;
          fbclid: string | null;
          fiscal_status: Database["public"]["Enums"]["fiscal_status_enum"];
          folio: string;
          gclid: string | null;
          id: string;
          import_batch_id: string | null;
          import_row_hash: string | null;
          import_source: string | null;
          lead_id: number | null;
          legacy_folio_raw: string | null;
          notes: string | null;
          order_status: Database["public"]["Enums"]["order_status_enum"];
          ordered_at: string;
          payment_status: Database["public"]["Enums"]["payment_status_enum"];
          payments_summary_json: NonNullable<Json>;
          pricing_snapshot_json: NonNullable<Json>;
          product_id: string | null;
          project_id: string | null;
          quantity_m3: number | null;
          quote_revision_id: string | null;
          scheduled_date: string | null;
          scheduled_slot_code: string | null;
          scheduled_time_label: string | null;
          scheduled_window_end: string | null;
          scheduled_window_start: string | null;
          seller_id: string | null;
          service_type: string | null;
          total_before_vat: number | null;
          total_with_vat: number | null;
          unit_price_before_vat: number | null;
          updated_at: string;
          user_id: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_medium: string | null;
          utm_source: string | null;
          utm_term: string | null;
          vat_rate: number | null;
          version: number;
          visitor_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          attribution_extra_json?: NonNullable<Json>;
          balance_amount?: number;
          company_id?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          customer_accepted_at?: string | null;
          customer_id?: string | null;
          delivery_address_id?: string | null;
          delivery_address_text?: string | null;
          external_ref?: string | null;
          fb_event_id?: string | null;
          fbclid?: string | null;
          fiscal_status?: Database["public"]["Enums"]["fiscal_status_enum"];
          folio: string;
          gclid?: string | null;
          id?: string;
          import_batch_id?: string | null;
          import_row_hash?: string | null;
          import_source?: string | null;
          lead_id?: number | null;
          legacy_folio_raw?: string | null;
          notes?: string | null;
          order_status?: Database["public"]["Enums"]["order_status_enum"];
          ordered_at?: string;
          payment_status?: Database["public"]["Enums"]["payment_status_enum"];
          payments_summary_json?: NonNullable<Json>;
          pricing_snapshot_json?: NonNullable<Json>;
          product_id?: string | null;
          project_id?: string | null;
          quantity_m3?: number | null;
          quote_revision_id?: string | null;
          scheduled_date?: string | null;
          scheduled_slot_code?: string | null;
          scheduled_time_label?: string | null;
          scheduled_window_end?: string | null;
          scheduled_window_start?: string | null;
          seller_id?: string | null;
          service_type?: string | null;
          total_before_vat?: number | null;
          total_with_vat?: number | null;
          unit_price_before_vat?: number | null;
          updated_at?: string;
          user_id?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
          vat_rate?: number | null;
          version?: number;
          visitor_id?: string | null;
        };
        Update: {
          attribution_extra_json?: NonNullable<Json>;
          balance_amount?: number;
          company_id?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          customer_accepted_at?: string | null;
          customer_id?: string | null;
          delivery_address_id?: string | null;
          delivery_address_text?: string | null;
          external_ref?: string | null;
          fb_event_id?: string | null;
          fbclid?: string | null;
          fiscal_status?: Database["public"]["Enums"]["fiscal_status_enum"];
          folio?: string;
          gclid?: string | null;
          id?: string;
          import_batch_id?: string | null;
          import_row_hash?: string | null;
          import_source?: string | null;
          lead_id?: number | null;
          legacy_folio_raw?: string | null;
          notes?: string | null;
          order_status?: Database["public"]["Enums"]["order_status_enum"];
          ordered_at?: string;
          payment_status?: Database["public"]["Enums"]["payment_status_enum"];
          payments_summary_json?: NonNullable<Json>;
          pricing_snapshot_json?: NonNullable<Json>;
          product_id?: string | null;
          project_id?: string | null;
          quantity_m3?: number | null;
          quote_revision_id?: string | null;
          scheduled_date?: string | null;
          scheduled_slot_code?: string | null;
          scheduled_time_label?: string | null;
          scheduled_window_end?: string | null;
          scheduled_window_start?: string | null;
          seller_id?: string | null;
          service_type?: string | null;
          total_before_vat?: number | null;
          total_with_vat?: number | null;
          unit_price_before_vat?: number | null;
          updated_at?: string;
          user_id?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
          vat_rate?: number | null;
          version?: number;
          visitor_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_customer_company";
            columns: ["company_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "orders_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_company_id_lead_id_fkey";
            columns: ["company_id", "lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "orders_company_id_project_id_customer_id_fkey";
            columns: ["company_id", "project_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["company_id", "id", "customer_id"];
          },
          {
            foreignKeyName: "orders_company_id_quote_revision_id_fkey";
            columns: ["company_id", "quote_revision_id"];
            isOneToOne: false;
            referencedRelation: "quote_revisions";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "orders_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_scheduled_slot_code_fkey";
            columns: ["scheduled_slot_code"];
            isOneToOne: false;
            referencedRelation: "service_slots";
            referencedColumns: ["slot_code"];
          },
          {
            foreignKeyName: "orders_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payroll: {
        Row: {
          amount: number;
          company_id: string | null;
          created_at: string;
          currency: string;
          employee: string;
          id: string;
          notes: string | null;
          period_end: string;
          period_start: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          company_id?: string | null;
          created_at?: string;
          currency?: string;
          employee: string;
          id?: string;
          notes?: string | null;
          period_end: string;
          period_start: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          company_id?: string | null;
          created_at?: string;
          currency?: string;
          employee?: string;
          id?: string;
          notes?: string | null;
          period_end?: string;
          period_start?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payroll_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payroll_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      price_config: {
        Row: {
          active: boolean;
          company_id: string | null;
          created_at: string;
          id: number;
          pricing_rules: NonNullable<Json>;
          updated_at: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          company_id?: string | null;
          created_at?: string;
          id?: number;
          pricing_rules: NonNullable<Json>;
          updated_at?: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          company_id?: string | null;
          created_at?: string;
          id?: number;
          pricing_rules?: NonNullable<Json>;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "price_config_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          base_price_mxn: number | null;
          category: string;
          client_price_mxn: number | null;
          company_id: string | null;
          created_at: string;
          legacy_external_id: string | null;
          metadata_json: NonNullable<Json>;
          mixer_mode: string | null;
          name: string;
          provider_name: string | null;
          pump_mode: string | null;
          sku: string;
          status: string;
          updated_at: string;
          utility_mxn: number | null;
        };
        ComputedFields: never;
        Insert: {
          base_price_mxn?: number | null;
          category: string;
          client_price_mxn?: number | null;
          company_id?: string | null;
          created_at?: string;
          legacy_external_id?: string | null;
          metadata_json?: NonNullable<Json>;
          mixer_mode?: string | null;
          name: string;
          provider_name?: string | null;
          pump_mode?: string | null;
          sku: string;
          status?: string;
          updated_at?: string;
          utility_mxn?: number | null;
        };
        Update: {
          base_price_mxn?: number | null;
          category?: string;
          client_price_mxn?: number | null;
          company_id?: string | null;
          created_at?: string;
          legacy_external_id?: string | null;
          metadata_json?: NonNullable<Json>;
          mixer_mode?: string | null;
          name?: string;
          provider_name?: string | null;
          pump_mode?: string | null;
          sku?: string;
          status?: string;
          updated_at?: string;
          utility_mxn?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          address: Json | null;
          company_name: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          rfc: string | null;
          role: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address?: Json | null;
          company_name?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          rfc?: string | null;
          role?: string;
          updated_at?: string;
        };
        Update: {
          address?: Json | null;
          company_name?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          rfc?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          address: string;
          company_id: string;
          created_at: string;
          customer_id: string;
          id: string;
          name: string;
          responsible_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          address: string;
          company_id: string;
          created_at?: string;
          customer_id: string;
          id?: string;
          name: string;
          responsible_id?: string | null;
        };
        Update: {
          address?: string;
          company_id?: string;
          created_at?: string;
          customer_id?: string;
          id?: string;
          name?: string;
          responsible_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_company_id_customer_id_fkey";
            columns: ["company_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "projects_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      quote_approvals: {
        Row: {
          authorized_at: string;
          authorized_by: string;
          company_id: string;
          reason: string;
          revision_id: string;
        };
        ComputedFields: never;
        Insert: {
          authorized_at?: string;
          authorized_by: string;
          company_id: string;
          reason: string;
          revision_id: string;
        };
        Update: {
          authorized_at?: string;
          authorized_by?: string;
          company_id?: string;
          reason?: string;
          revision_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quote_approvals_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_approvals_company_id_revision_id_fkey";
            columns: ["company_id", "revision_id"];
            isOneToOne: false;
            referencedRelation: "quote_revisions";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      quote_revisions: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string;
          customer_id: string | null;
          exception_reason: string | null;
          id: string;
          lead_id: number | null;
          needs_approval: boolean;
          pending_tax: boolean;
          project_id: string | null;
          quote_id: string;
          revision: number;
          snapshot: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          company_id: string;
          created_at?: string;
          created_by: string;
          customer_id?: string | null;
          exception_reason?: string | null;
          id?: string;
          lead_id?: number | null;
          needs_approval?: boolean;
          pending_tax?: boolean;
          project_id?: string | null;
          quote_id: string;
          revision: number;
          snapshot: NonNullable<Json>;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string;
          customer_id?: string | null;
          exception_reason?: string | null;
          id?: string;
          lead_id?: number | null;
          needs_approval?: boolean;
          pending_tax?: boolean;
          project_id?: string | null;
          quote_id?: string;
          revision?: number;
          snapshot?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "quote_revisions_company_id_customer_id_fkey";
            columns: ["company_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "quote_revisions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_revisions_company_id_lead_id_fkey";
            columns: ["company_id", "lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "quote_revisions_company_id_project_id_customer_id_fkey";
            columns: ["company_id", "project_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["company_id", "id", "customer_id"];
          },
          {
            foreignKeyName: "quote_revisions_company_id_quote_id_fkey";
            columns: ["company_id", "quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      quotes: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string;
          current_revision: number;
          customer_id: string | null;
          folio: string;
          id: string;
          lead_id: number | null;
          project_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          company_id: string;
          created_at?: string;
          created_by: string;
          current_revision?: number;
          customer_id?: string | null;
          folio?: string;
          id?: string;
          lead_id?: number | null;
          project_id?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string;
          current_revision?: number;
          customer_id?: string | null;
          folio?: string;
          id?: string;
          lead_id?: number | null;
          project_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_company_id_customer_id_fkey";
            columns: ["company_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "quotes_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_company_id_lead_id_fkey";
            columns: ["company_id", "lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "quotes_company_id_project_id_customer_id_fkey";
            columns: ["company_id", "project_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["company_id", "id", "customer_id"];
          },
        ];
      };
      sale_facts: {
        Row: {
          actor_id: string;
          amount_mxn: number;
          company_id: string;
          currency: string;
          customer_id: string;
          id: string;
          imported: boolean;
          occurred_at: string;
          order_id: string;
          origin: string | null;
          quote_revision_id: string | null;
          source_channel: string | null;
        };
        ComputedFields: never;
        Insert: {
          actor_id: string;
          amount_mxn: number;
          company_id: string;
          currency: string;
          customer_id: string;
          id?: string;
          imported?: boolean;
          occurred_at: string;
          order_id: string;
          origin?: string | null;
          quote_revision_id?: string | null;
          source_channel?: string | null;
        };
        Update: {
          actor_id?: string;
          amount_mxn?: number;
          company_id?: string;
          currency?: string;
          customer_id?: string;
          id?: string;
          imported?: boolean;
          occurred_at?: string;
          order_id?: string;
          origin?: string | null;
          quote_revision_id?: string | null;
          source_channel?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sale_facts_company_id_customer_id_fkey";
            columns: ["company_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "sale_facts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_facts_company_id_order_id_fkey";
            columns: ["company_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "sale_facts_company_id_quote_revision_id_fkey";
            columns: ["company_id", "quote_revision_id"];
            isOneToOne: false;
            referencedRelation: "quote_revisions";
            referencedColumns: ["company_id", "id"];
          },
        ];
      };
      service_slots: {
        Row: {
          end_time: string;
          label: string;
          slot_code: string;
          start_time: string;
        };
        ComputedFields: never;
        Insert: {
          end_time: string;
          label: string;
          slot_code: string;
          start_time: string;
        };
        Update: {
          end_time?: string;
          label?: string;
          slot_code?: string;
          start_time?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      followup_queue: {
        Row: {
          action: string;
          company_id: string;
          completed_at: string | null;
          customer_id: string;
          customer_name: string;
          due_at: string;
          due_bucket: string | null;
          id: string;
          previous_id: string | null;
          project_id: string | null;
          project_name: string | null;
          responsible_id: string;
          result: string | null;
          version: number;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "followups_company_id_customer_id_fkey";
            columns: ["company_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "followups_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "followups_company_id_previous_id_fkey";
            columns: ["company_id", "previous_id"];
            isOneToOne: false;
            referencedRelation: "followup_queue";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "followups_company_id_previous_id_fkey";
            columns: ["company_id", "previous_id"];
            isOneToOne: false;
            referencedRelation: "followups";
            referencedColumns: ["company_id", "id"];
          },
          {
            foreignKeyName: "followups_company_id_project_id_customer_id_fkey";
            columns: ["company_id", "project_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["company_id", "id", "customer_id"];
          },
        ];
      };
    };
    Functions: {
      cej_capture_web_request: {
        Args: { host: string; p: Json };
        Returns: Json;
      };
      cej_command: {
        Args: { actor: string; c: string; kind: string; p: Json };
        Returns: Json;
      };
      cej_lease_test_outbox: {
        Args: { c: string; max_items?: number };
        Returns: {
          api_receipt: Json | null;
          attempts: number;
          company_id: string;
          event_id: string;
          event_name: string;
          fact_id: string;
          id: string;
          last_error: string | null;
          leased_until: string | null;
          next_attempt_at: string;
          occurred_at: string;
          payload: Json | null;
          status: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "marketing_outbox";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      cej_promote_import: {
        Args: {
          actor: string;
          c: string;
          expected_hash: string;
          row_id: string;
        };
        Returns: Json;
      };
      cej_role: { Args: { c: string; u: string }; Returns: string };
      cej_search_orders: {
        Args: {
          c: string;
          page_number?: number;
          state?: string;
          term?: string;
        };
        Returns: Json;
      };
      cej_summary: { Args: { c: string }; Returns: Json };
    };
    Enums: {
      fiscal_status_enum:
        "not_requested" | "requested" | "issued" | "cancelled";
      lead_status_enum:
        "new" | "contacted" | "qualified" | "converted" | "lost" | "archived";
      order_status_enum:
        | "draft"
        | "confirmed"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled";
      payment_direction_enum: "in" | "out";
      payment_kind_enum:
        | "anticipo"
        | "abono"
        | "liquidacion"
        | "ajuste"
        | "refund"
        | "chargeback";
      payment_method_enum:
        "efectivo" | "transferencia" | "credito" | "deposito" | "otro";
      payment_status_enum: "pending" | "partial" | "paid" | "overpaid";
      record_origin_enum: "legacy_import" | "system_captured";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      fiscal_status_enum: ["not_requested", "requested", "issued", "cancelled"],
      lead_status_enum: [
        "new",
        "contacted",
        "qualified",
        "converted",
        "lost",
        "archived",
      ],
      order_status_enum: [
        "draft",
        "confirmed",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      payment_direction_enum: ["in", "out"],
      payment_kind_enum: [
        "anticipo",
        "abono",
        "liquidacion",
        "ajuste",
        "refund",
        "chargeback",
      ],
      payment_method_enum: [
        "efectivo",
        "transferencia",
        "credito",
        "deposito",
        "otro",
      ],
      payment_status_enum: ["pending", "partial", "paid", "overpaid"],
      record_origin_enum: ["legacy_import", "system_captured"],
    },
  },
} as const;
