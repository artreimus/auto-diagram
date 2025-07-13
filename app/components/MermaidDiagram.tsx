'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

type MermaidProps = {
  id: string;
  chart: string;
};

const MermaidDiagram = ({ id, chart }: MermaidProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
    });
  }, []);

  useEffect(() => {
    if (chart && containerRef.current) {
      mermaid
        .render(id, chart)
        .then(({ svg, bindFunctions }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
            if (bindFunctions) {
              bindFunctions(containerRef.current);
            }
          }
        })
        .catch((error) => {
          console.error('Error rendering Mermaid chart:', error);
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div class="text-red-400 p-4 border border-red-400 rounded-lg">
                <p class="font-bold">Error rendering chart.</p>
                <pre class="mt-2 text-sm whitespace-pre-wrap">${chart}</pre>
              </div>
            `;
          }
        });
    }
  }, [id, chart]);

  return <div ref={containerRef} />;
};

export default MermaidDiagram;
