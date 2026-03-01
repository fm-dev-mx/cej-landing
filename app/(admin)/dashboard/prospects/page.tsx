import { permanentRedirect } from 'next/navigation';

export default function LegacyProspectsPage() {
    permanentRedirect('/dashboard/customers');
}

