// Locales currently shipped. To add a new language:
// 1. Add the code here (e.g. 'fr', 'pt', 'de').
// 2. Create lib/i18n/messages/{code}.ts as a copy of es.ts and translate.
// 3. Register it in the LOCALES record in lib/i18n/messages/index.ts.
// 4. Add a label in components/layout/language-switcher.tsx.
export type Locale = "es" | "en";

export type Messages = Record<string, string>;
