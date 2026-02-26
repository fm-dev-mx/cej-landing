---
description: Template for creating new React components with consistent structure
---

# New Component Workflow

Guide for creating new React components in `cej-landing`.

## 1. File Structure

Create the following files for a new component:

```text
components/
└── ComponentName/
    ├── ComponentName.tsx         # Main component
    ├── ComponentName.module.scss # Styles
    ├── ComponentName.test.tsx    # Tests (if interactive)
    └── index.ts                  # Barrel export
```

**For UI atoms (`components/ui/`):**

```text
components/ui/
└── ComponentName/
    ├── ComponentName.tsx
    ├── ComponentName.module.scss
    └── index.ts
```

## 2. Component Template

```tsx
'use client';

import styles from './ComponentName.module.scss';

interface ComponentNameProps {
    // Define props with clear types
    title: string;
    onAction?: () => void;
    children?: React.ReactNode;
}

export function ComponentName({ title, onAction, children }: ComponentNameProps) {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>{title}</h2>
            {children}
            {onAction && (
                <button className={styles.button} onClick={onAction}>
                    {/* Spanish label */}
                    Acción
                </button>
            )}
        </div>
    );
}
```

## 3. SCSS Module Template

```scss
@use 'styles/tokens' as *;

.container {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    padding: var(--sp-4);
    background: var(--c-surface);
    border-radius: var(--radius-md);
}

.title {
    font-size: var(--fs-lg);
    font-weight: var(--fw-semibold);
    color: var(--c-text-primary);
}

.button {
    // Use Button component instead when possible
}
```

## 4. Barrel Export Template

```ts
// index.ts
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```

## 5. Test Template

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
    it('renders title correctly', () => {
        render(<ComponentName title="Test Title" />);
        expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('calls onAction when button is clicked', async () => {
        const user = userEvent.setup();
        const handleAction = vi.fn();

        render(<ComponentName title="Test" onAction={handleAction} />);

        await user.click(screen.getByRole('button'));
        expect(handleAction).toHaveBeenCalledOnce();
    });
});
```

## 6. Naming Conventions

| Item | Convention | Example |
|:-----|:-----------|:--------|
| Component | PascalCase | `QuoteSummary` |
| File | PascalCase | `QuoteSummary.tsx` |
| SCSS Module | PascalCase | `QuoteSummary.module.scss` |
| CSS class | camelCase | `.quoteSummary` |
| Hook | camelCase + `use` | `useQuoteCalculator` |
| Utility | camelCase | `formatCurrency` |

## 7. Checklist

Before finishing:

- [ ] Component uses SCSS Module (not inline styles)
- [ ] All UI text is in Spanish
- [ ] Props interface is exported
- [ ] Barrel export in `index.ts`
- [ ] Accessibility: ARIA labels where needed
- [ ] Test file created (for interactive components)
- [ ] Update `docs/COMPONENT_LIBRARY.md` if public component

## 8. Documentation Update

For significant components, add entry to `docs/COMPONENT_LIBRARY.md`:

```markdown
## N. ComponentName

**Path:** `components/ComponentName/ComponentName.tsx`

### Description
Brief description of what the component does.

### Props
| Prop | Type | Required | Description |
|:-----|:-----|:---------|:------------|
| title | string | ✅ | ... |

### Usage
\`\`\`tsx
<ComponentName title="Example" />
\`\`\`
```
