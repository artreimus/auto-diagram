import { PromptTemplate } from '../prompt-template';

describe('PromptTemplate', () => {
  describe('Basic functionality', () => {
    test('should create a template with simple string replacement', () => {
      const template = PromptTemplate.create`Hello ${'name'}!`;
      const result = template.format({ name: 'World' });
      expect(result).toBe('Hello World!');
    });

    test('should handle multiple variables', () => {
      const template = PromptTemplate.create<{
        greeting: string;
        name: string;
        punctuation: string;
      }>`${'greeting'} ${'name'}${'punctuation'}`;

      const result = template.format({
        greeting: 'Hello',
        name: 'Alice',
        punctuation: '!',
      });

      expect(result).toBe('Hello Alice!');
    });

    test('should handle empty strings', () => {
      const template = PromptTemplate.create`Welcome ${'name'}`;
      const result = template.format({ name: '' });
      expect(result).toBe('Welcome ');
    });

    test('should coerce non-string values to strings', () => {
      const template = PromptTemplate.create<{
        count: number;
        isActive: boolean;
        items: string[];
      }>`Count: ${'count'}, Active: ${'isActive'}, Items: ${'items'}`;

      const result = template.format({
        count: 42,
        isActive: true,
        items: ['a', 'b', 'c'],
      });

      expect(result).toBe('Count: 42, Active: true, Items: a,b,c');
    });
  });

  describe('formatOptional method', () => {
    test('should skip undefined values', () => {
      const template = PromptTemplate.create<{
        required: string;
        optional?: string;
      }>`Required: ${'required'}, Optional: ${'optional'}`;

      const result = template.formatOptional({
        required: 'value',
        optional: undefined,
      });

      expect(result).toBe('Required: value, Optional: ');
    });

    test('should skip null values', () => {
      const template = PromptTemplate.create<{
        required: string;
        optional: string | null;
      }>`Required: ${'required'}, Optional: ${'optional'}`;

      const result = template.formatOptional({
        required: 'value',
        optional: null,
      });

      expect(result).toBe('Required: value, Optional: ');
    });

    test('should skip empty string values', () => {
      const template = PromptTemplate.create<{
        required: string;
        optional: string;
      }>`Required: ${'required'}, Optional: ${'optional'}`;

      const result = template.formatOptional({
        required: 'value',
        optional: '',
      });

      expect(result).toBe('Required: value, Optional: ');
    });

    test('should include valid values', () => {
      const template = PromptTemplate.create<{
        name: string;
        age: number;
        active: boolean;
      }>`Name: ${'name'}, Age: ${'age'}, Active: ${'active'}`;

      const result = template.formatOptional({
        name: 'John',
        age: 30,
        active: false, // false should be included
      });

      expect(result).toBe('Name: John, Age: 30, Active: false');
    });
  });

  describe('Complex templates', () => {
    test('should handle multiline templates', () => {
      const template = PromptTemplate.create<{
        title: string;
        content: string;
      }>`# ${'title'}

This is the content:
${'content'}

End of template.`;

      const result = template.format({
        title: 'My Title',
        content: 'Some important content here.',
      });

      expect(result).toBe(`# My Title

This is the content:
Some important content here.

End of template.`);
    });

    test('should handle templates with no variables', () => {
      const template = PromptTemplate.create`This is a static template with no variables.`;
      const result = template.format({});
      expect(result).toBe('This is a static template with no variables.');
    });

    test('should handle special characters in template', () => {
      const template = PromptTemplate.create<{
        code: string;
      }>`Here is some code: \`${'code'}\`
And some markdown **bold** text.`;

      const result = template.format({
        code: 'console.log("hello");',
      });

      expect(result).toBe(
        'Here is some code: `console.log("hello");`\nAnd some markdown **bold** text.'
      );
    });
  });

  describe('Type safety', () => {
    test('should enforce type constraints at compile time', () => {
      // This test mainly verifies TypeScript compilation
      // At runtime, we can test that the correct properties are expected
      const template = PromptTemplate.create<{
        name: string;
        age: number;
      }>`Name: ${'name'}, Age: ${'age'}`;

      // This should work
      const result = template.format({ name: 'Alice', age: 25 });
      expect(result).toBe('Name: Alice, Age: 25');

      // TypeScript should catch missing properties, but we can't test that at runtime
      // The test here is that the above compiles without errors
    });
  });

  describe('Edge cases', () => {
    test('should handle arrays in template variables', () => {
      const template = PromptTemplate.create<{
        items: string[];
      }>`Items: ${'items'}`;

      const result = template.format({
        items: ['apple', 'banana', 'cherry'],
      });

      expect(result).toBe('Items: apple,banana,cherry');
    });

    test('should handle readonly arrays', () => {
      const template = PromptTemplate.create<{
        items: readonly string[];
      }>`Items: ${'items'}`;

      const result = template.format({
        items: ['one', 'two', 'three'] as const,
      });

      expect(result).toBe('Items: one,two,three');
    });

    test('should handle zero as a valid value', () => {
      const template = PromptTemplate.create<{
        count: number;
      }>`Count: ${'count'}`;

      const result = template.format({ count: 0 });
      expect(result).toBe('Count: 0');
    });

    test('should handle false as a valid value', () => {
      const template = PromptTemplate.create<{
        enabled: boolean;
      }>`Enabled: ${'enabled'}`;

      const result = template.format({ enabled: false });
      expect(result).toBe('Enabled: false');
    });
  });
});
