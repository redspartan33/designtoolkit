import type { Locale, Messages } from "../types";
import { en } from "./en";
import { es } from "./es";

export const LOCALES: Record<Locale, Messages> = { es, en };

export const DEFAULT_LOCALE: Locale = "es";
