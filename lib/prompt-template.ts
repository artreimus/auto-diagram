/**
 * Minimal prompt-templating utility.
 *
 * Usage:
 *   const tpl = PromptTemplate.create`
 *     Brainstorm 3 names for a superhero ${"animal"}.
 *   `
 *
 *   const prompt = tpl.format({ animal: "cat" });
 *   // -> "Brainstorm 3 names for a superhero cat."
 */

type Dict = Record<string, unknown>;

export class PromptTemplate<T extends Dict = Dict> {
  private readonly strings: TemplateStringsArray;
  private readonly keys: (keyof T)[];

  // Private constructor – enforce use of tagged-template
  private constructor(strings: TemplateStringsArray, keys: (keyof T)[]) {
    this.strings = strings;
    this.keys = keys;
  }

  /** Tagged-template entry point: `PromptTemplate.create\` ... \`` */
  static create<T extends Dict = Dict>(
    strings: TemplateStringsArray,
    ...keys: (keyof T)[]
  ): PromptTemplate<T> {
    return new PromptTemplate<T>(strings, keys);
  }

  /** Replace placeholders with the corresponding values */
  format(values: T): string {
    let out = this.strings[0] ?? '';

    this.keys.forEach((key, i) => {
      // Use `String()` to coerce non-string values safely
      out += String(values[key]);
      out += this.strings[i + 1] ?? '';
    });

    return out;
  }

  /** Replace placeholders with the corresponding values, with optional value handling */
  formatOptional(values: Partial<T>): string {
    let out = this.strings[0] ?? '';

    this.keys.forEach((key, i) => {
      const value = values[key];
      // Only include non-empty values
      if (value !== undefined && value !== null && value !== '') {
        out += String(value);
      }
      out += this.strings[i + 1] ?? '';
    });

    return out;
  }
}
