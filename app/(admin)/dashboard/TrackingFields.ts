export const TRACKING_FIELDS = [
    { id: 'utm_source', label: 'UTM Source' },
    { id: 'utm_medium', label: 'UTM Medium' },
    { id: 'utm_campaign', label: 'UTM Campaign' },
    { id: 'utm_term', label: 'UTM Term' },
    { id: 'utm_content', label: 'UTM Content' },
    { id: 'fbclid', label: 'FBCLID' },
    { id: 'gclid', label: 'GCLID' },
];

export const TRACKING_FIELD_NAMES = TRACKING_FIELDS.map(f => f.id);
