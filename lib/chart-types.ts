export const supportedChartTypes = [
  'flowchart',
  'sequence',
  'class',
  'state',
  'gantt',
  'journey',
  'mindmap',
  'timeline',
  'gitgraph',
] as const;

export type SupportedChartType = (typeof supportedChartTypes)[number];
