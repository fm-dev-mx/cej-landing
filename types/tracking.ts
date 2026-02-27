/**
 * Structure for Meta CAPI User Data.
 */
export interface CapiUserData {
    em?: string; // Hashed Email
    ph?: string; // Hashed Phone
    client_ip_address: string;
    client_user_agent: string;
    fbc?: string;
    fbp?: string;
    external_id?: string;
    fn?: string;
}

/**
 * Structure for Meta CAPI Events.
 */
export interface CapiEvent {
    event_name: string;
    event_time: number;
    event_id: string;
    event_source_url: string;
    action_source: 'website';
    user_data: CapiUserData;
    custom_data?: Record<string, unknown>;
}
