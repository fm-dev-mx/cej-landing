import { ReactNode } from "react";
import styles from "./SkipLink.module.scss";

export default function SkipLink(): ReactNode {
    return (
        <a href="#main-content" className={styles.skipLink}>
            Saltar al contenido principal
        </a>
    );
}
