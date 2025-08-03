import { ChartType } from '@/app/enum/chart-types';
import {
  createMermaidGenerationSystemPrompt,
  createMermaidGenerationUserPrompt,
  createMermaidFixSystemPrompt,
  createMermaidFixUserPrompt,
  createPlannerSystemPrompt,
  mermaidBestPractices,
  mermaidGenerationUserTemplate,
  mermaidFixUserTemplate,
  plannerSystemTemplate,
} from '../app/lib/prompt-utils';

describe('Prompt Functions', () => {
  describe('createMermaidGenerationSystemPrompt', () => {
    test('should return system prompt with best practices included', () => {
      const prompt = createMermaidGenerationSystemPrompt();

      expect(prompt).toContain(
        'You are an expert at creating Mermaid diagrams'
      );
      expect(prompt).toContain(
        'You must respond with a JSON object containing exactly three fields'
      );
      expect(prompt).toContain('type');
      expect(prompt).toContain('description');
      expect(prompt).toContain('chart');
      expect(prompt).toContain(mermaidBestPractices);
      expect(prompt).toContain('flowchart');
      expect(prompt).toContain('sequence');
      expect(prompt).toContain('class');
      expect(prompt).toContain('gantt');
      expect(prompt).toContain('state');
    });

    test('should be a static prompt without variables', () => {
      const prompt1 = createMermaidGenerationSystemPrompt();
      const prompt2 = createMermaidGenerationSystemPrompt();
      expect(prompt1).toBe(prompt2);
    });
  });

  describe('createMermaidGenerationUserPrompt', () => {
    test('should include chart type', () => {
      const prompt = createMermaidGenerationUserPrompt('flowchart');
      expect(prompt).toContain('Generate a **flowchart** chart');
    });

    test('should include original user message when provided', () => {
      const originalMessage = 'Create a login flow diagram';
      const prompt = createMermaidGenerationUserPrompt(
        'flowchart',
        originalMessage
      );

      expect(prompt).toContain('**Original User Request:**');
      expect(prompt).toContain(originalMessage);
    });

    test('should include plan description when provided', () => {
      const planDescription = 'Show user authentication steps with validation';
      const prompt = createMermaidGenerationUserPrompt(
        'sequence',
        '',
        planDescription
      );

      expect(prompt).toContain('**Chart Plan:**');
      expect(prompt).toContain(planDescription);
    });

    test('should include instructions when both original message and plan are provided', () => {
      const originalMessage = 'I need an authentication diagram';
      const planDescription = 'Create a sequence diagram showing login flow';
      const prompt = createMermaidGenerationUserPrompt(
        'sequence',
        originalMessage,
        planDescription
      );

      expect(prompt).toContain('**Original User Request:**');
      expect(prompt).toContain(originalMessage);
      expect(prompt).toContain('**Chart Plan:**');
      expect(prompt).toContain(planDescription);
      expect(prompt).toContain('**Instructions:**');
      expect(prompt).toContain(
        "Your chart must directly address the original user's question"
      );
    });

    test('should not include instructions when only one of original message or plan is provided', () => {
      const promptWithMessage = createMermaidGenerationUserPrompt(
        'flowchart',
        'Create a diagram',
        ''
      );
      expect(promptWithMessage).not.toContain('**Instructions:**');

      const promptWithPlan = createMermaidGenerationUserPrompt(
        'flowchart',
        '',
        'Show a simple flow'
      );
      expect(promptWithPlan).not.toContain('**Instructions:**');
    });

    test('should handle empty strings gracefully', () => {
      const prompt = createMermaidGenerationUserPrompt('class', '', '');
      expect(prompt).toContain('Generate a **class** chart');
      expect(prompt).not.toContain('**Original User Request:**');
      expect(prompt).not.toContain('**Chart Plan:**');
      expect(prompt).not.toContain('**Instructions:**');
      expect(prompt).toContain('Create the Mermaid diagram now');
    });

    test('should work with all chart types', () => {
      Object.values(ChartType).forEach((chartType) => {
        const prompt = createMermaidGenerationUserPrompt(chartType);
        expect(prompt).toContain(`Generate a **${chartType}** chart`);
      });
    });
  });

  describe('createMermaidFixSystemPrompt', () => {
    test('should return fix system prompt with best practices', () => {
      const prompt = createMermaidFixSystemPrompt();

      expect(prompt).toContain(
        'You are an expert at debugging and fixing Mermaid diagram syntax errors'
      );
      expect(prompt).toContain('CRITICAL RULES FOR SYNTAX FIXING');
      expect(prompt).toContain('PRESERVE ORIGINAL CONTENT');
      expect(prompt).toContain('FIX SYNTAX ONLY');
      expect(prompt).toContain('two fields');
      expect(prompt).toContain('explanation');
      expect(prompt).toContain(mermaidBestPractices);
    });

    test('should be consistent across calls', () => {
      const prompt1 = createMermaidFixSystemPrompt();
      const prompt2 = createMermaidFixSystemPrompt();
      expect(prompt1).toBe(prompt2);
    });
  });

  describe('createMermaidFixUserPrompt', () => {
    const testChart = 'flowchart TD\n  A --> B';
    const testError = 'Parse error on line 2';

    test('should include all required fields', () => {
      const prompt = createMermaidFixUserPrompt(
        'flowchart',
        testChart,
        testError
      );

      expect(prompt).toContain(
        'Please fix ONLY the syntax errors in this **flowchart** Mermaid chart'
      );
      expect(prompt).toContain('## Original broken chart:');
      expect(prompt).toContain(testChart);
      expect(prompt).toContain('## Error encountered:');
      expect(prompt).toContain(testError);
      expect(prompt).toContain(
        'SYNTAX REPAIR ONLY. Fix the code to render properly while preserving ALL original content and intent'
      );
    });

    test('should include plan description when provided', () => {
      const planDescription = 'This should show a simple flow from A to B';
      const prompt = createMermaidFixUserPrompt(
        'flowchart',
        testChart,
        testError,
        planDescription
      );

      expect(prompt).toContain('**Chart Plan:**');
      expect(prompt).toContain(
        `This chart should fulfill: "${planDescription}"`
      );
      expect(prompt).toContain('**CRITICAL:** This is a SYNTAX FIX operation');
    });

    test('should not include plan description when not provided', () => {
      const prompt = createMermaidFixUserPrompt(
        'flowchart',
        testChart,
        testError
      );
      expect(prompt).not.toContain('**Chart Plan:**');
      expect(prompt).toContain('**CRITICAL:**'); // CRITICAL is always included in the template
    });

    test('should handle empty plan description', () => {
      const prompt = createMermaidFixUserPrompt(
        'flowchart',
        testChart,
        testError,
        ''
      );
      expect(prompt).not.toContain('**Chart Plan:**');
    });

    test('should work with different chart types', () => {
      ['flowchart', 'sequence', 'class', 'gantt', 'state'].forEach(
        (chartType) => {
          const prompt = createMermaidFixUserPrompt(
            chartType,
            testChart,
            testError
          );
          expect(prompt).toContain(`**${chartType}** Mermaid chart`);
        }
      );
    });
  });

  describe('createPlannerSystemPrompt', () => {
    test('should include all supported chart types', () => {
      const prompt = createPlannerSystemPrompt();

      expect(prompt).toContain(
        'You are an expert at creating Mermaid diagrams and planning comprehensive visualizations'
      );
      expect(prompt).toContain('Your supported chart types are:');

      // Check that all chart types are included
      Object.values(ChartType).forEach((chartType) => {
        expect(prompt).toContain(chartType);
      });
    });

    test('should include formatting requirements', () => {
      const prompt = createPlannerSystemPrompt();

      expect(prompt).toContain('FORMATTING REQUIREMENT');
      expect(prompt).toContain('**Bold text**');
      expect(prompt).toContain('_Italic text_');
      expect(prompt).toContain('`Inline code`');
      expect(prompt).toContain('Numbered and bulleted lists');
      expect(prompt).toContain('Headers (##, ###)');
    });

    test('should specify response format', () => {
      const prompt = createPlannerSystemPrompt();

      expect(prompt).toContain(
        'You must respond with a direct array of objects'
      );
      expect(prompt).toContain('exactly two fields');
      expect(prompt).toContain('"type": one of the supported chart types');
      expect(prompt).toContain(
        '"description": an EXTREMELY DETAILED specification'
      );
    });

    test('should be consistent across calls', () => {
      const prompt1 = createPlannerSystemPrompt();
      const prompt2 = createPlannerSystemPrompt();
      expect(prompt1).toBe(prompt2);
    });
  });
});

describe('Template Variables', () => {
  describe('mermaidGenerationUserTemplate', () => {
    test('should have all required template variables', () => {
      const templateString = mermaidGenerationUserTemplate.format({
        chartType: 'TEST_CHART_TYPE',
        originalUserMessage: 'TEST_ORIGINAL_MESSAGE',
        planDescription: 'TEST_PLAN_DESCRIPTION',
        hasOriginalMessage: 'TEST_HAS_ORIGINAL',
        hasPlanDescription: 'TEST_HAS_PLAN',
        hasInstructions: 'TEST_HAS_INSTRUCTIONS',
      });

      expect(templateString).toContain('TEST_CHART_TYPE');
      expect(templateString).toContain('TEST_HAS_ORIGINAL');
      expect(templateString).toContain('TEST_HAS_PLAN');
      expect(templateString).toContain('TEST_HAS_INSTRUCTIONS');
    });
  });

  describe('mermaidFixUserTemplate', () => {
    test('should have all required template variables', () => {
      const templateString = mermaidFixUserTemplate.format({
        chartType: 'TEST_CHART_TYPE',
        chart: 'TEST_CHART_CONTENT',
        error: 'TEST_ERROR_MESSAGE',
        hasPlanDescription: 'TEST_HAS_PLAN',
      });

      expect(templateString).toContain('TEST_CHART_TYPE');
      expect(templateString).toContain('TEST_CHART_CONTENT');
      expect(templateString).toContain('TEST_ERROR_MESSAGE');
      expect(templateString).toContain('TEST_HAS_PLAN');
    });
  });

  describe('plannerSystemTemplate', () => {
    test('should have supportedChartTypes variable', () => {
      const testChartTypes = ['flowchart', 'sequence', 'class'];
      const templateString = plannerSystemTemplate.format({
        supportedChartTypes: testChartTypes,
      });

      expect(templateString).toContain('flowchart,sequence,class');
    });
  });
});

describe('Best Practices Content', () => {
  test('mermaidBestPractices should contain essential syntax rules', () => {
    expect(mermaidBestPractices).toContain(
      'Golden rules to avoid "invalid syntax"'
    );
    expect(mermaidBestPractices).toContain(
      'Always start with a diagram type keyword'
    );
    expect(mermaidBestPractices).toContain('Quote fragile labels');
    expect(mermaidBestPractices).toContain('Common parse errors & fixes');
    expect(mermaidBestPractices).toContain('flowchart');
    expect(mermaidBestPractices).toContain('sequenceDiagram');
    expect(mermaidBestPractices).toContain('classDiagram');
  });

  test('system prompts should include best practices', () => {
    const generationSystemPrompt = createMermaidGenerationSystemPrompt();
    const fixSystemPrompt = createMermaidFixSystemPrompt();

    expect(generationSystemPrompt).toContain(mermaidBestPractices);
    expect(fixSystemPrompt).toContain(mermaidBestPractices);
  });
});

describe('Integration Tests', () => {
  test('all prompt functions should return non-empty strings', () => {
    expect(createMermaidGenerationSystemPrompt().length).toBeGreaterThan(0);
    expect(
      createMermaidGenerationUserPrompt('flowchart').length
    ).toBeGreaterThan(0);
    expect(createMermaidFixSystemPrompt().length).toBeGreaterThan(0);
    expect(
      createMermaidFixUserPrompt('flowchart', 'chart', 'error').length
    ).toBeGreaterThan(0);
    expect(createPlannerSystemPrompt().length).toBeGreaterThan(0);
  });

  test('prompts should not contain template syntax artifacts', () => {
    const prompts = [
      createMermaidGenerationSystemPrompt(),
      createMermaidGenerationUserPrompt(
        'flowchart',
        'test message',
        'test plan'
      ),
      createMermaidFixSystemPrompt(),
      createMermaidFixUserPrompt(
        'flowchart',
        'test chart',
        'test error',
        'test plan'
      ),
      createPlannerSystemPrompt(),
    ];

    prompts.forEach((prompt) => {
      expect(prompt).not.toContain('${');
      expect(prompt).not.toContain('undefined');
      expect(prompt).not.toContain('[object Object]');
    });
  });
});
