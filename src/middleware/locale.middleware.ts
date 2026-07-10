import { Request, Response, NextFunction } from 'express';

const SUPPORTED_LOCALES = ['en', 'am', 'gez'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

export function localeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  let lang: string | undefined;

  // 1. Extract from query parameter ?lang=
  if (typeof req.query.lang === 'string') {
    lang = req.query.lang.toLowerCase();
  }

  // 2. Extract from Accept-Language header if query param not set
  if (!lang) {
    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage) {
      // Parse first header value e.g. "am,en-US;q=0.9,en;q=0.8" -> "am"
      const match = acceptLanguage.split(',')[0].trim().split(';')[0].trim();
      lang = match.toLowerCase();
    }
  }

  // 3. Fallback check & assign
  if (lang && SUPPORTED_LOCALES.includes(lang as Locale)) {
    req.locale = lang as Locale;
  } else {
    req.locale = 'en';
  }

  next();
}
