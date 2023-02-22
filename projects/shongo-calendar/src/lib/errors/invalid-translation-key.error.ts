export class InvalidTranslationKeyError extends Error {
  constructor(key: string) {
    super(`Invalid translation key: ${key}`);
  }
}
