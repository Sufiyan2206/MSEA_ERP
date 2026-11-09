# MyLearnSpace — Modern Enterprise UI update

This package contains the MyLearnSpace frontend with the Modern Enterprise visual refresh.

## Design updates
- Deep navy application header and sidebar with teal active-navigation accents.
- Updated MyLearnSpace brand lockup, global search entry point, connection indicator, notification entry point and user identity.
- Cleaner sidebar grouping and navigation states.
- Refined workspace background, cards, KPI tiles, buttons, forms, tables, pills, dialogs and toast styling.
- Responsive header, navigation drawer and mobile bottom navigation.
- Existing React routes, permission filtering, API calls, legacy module host and business logic are retained.

## Files changed
- `src/components/Shell.tsx`
- `src/styles.css`

## Build
Install dependencies for your operating system, then run:

```bash
npm ci
npm run build
```

`node_modules` and generated `dist` output are intentionally not included. Rebuild the frontend using the project's normal build/deployment process after replacing the frontend source.
