'use client';

import { usePublicStore } from "@/store/public/usePublicStore";
import styles from './ExpertToggle.module.scss';

export default function ExpertToggle() {
    const isExpert = usePublicStore((s) => s.draft.showExpertOptions);
    const updateDraft = usePublicStore((s) => s.updateDraft);

    return (
        <button
            className={`${styles.expertToggle} ${isExpert ? styles.active : ""}`}
            onClick={() => updateDraft({ showExpertOptions: !isExpert })}
            // A11y: Semantic toggle state
            aria-pressed={isExpert}
            type="button"
        >
            <span className={styles.icon}>
                {isExpert ? "🛠️" : "⚙️"}
            </span>
            <span className={styles.text}>
                {isExpert ? "Modo Experto" : "Config. Avanzada"}
            </span>

            {isExpert && (
                <span className={styles.activeIndicator} />
            )}
        </button>
    );
}
