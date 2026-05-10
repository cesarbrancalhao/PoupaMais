import type { Chart, LegendItem } from 'chart.js';

export function getLegendConfig(textColor: string) {
  return {
    position: 'top' as const,
    labels: {
      color: textColor,
      usePointStyle: true,
      pointStyle: 'rect' as const,
      pointStyleWidth: 8,
      padding: 16,
      generateLabels(chart: Chart): LegendItem[] {
        const datasets = chart.data.datasets;
        return datasets.map((dataset, i): LegendItem => {
          const meta = chart.getDatasetMeta(i);
          const borderColor = Array.isArray(dataset.borderColor)
            ? dataset.borderColor[0]
            : (dataset.borderColor as string);
          const isDashed =
            (((dataset as unknown as Record<string, unknown>).borderDash as number[] | undefined)?.length ?? 0) > 0;

          return {
            text: dataset.label || '',
            fillStyle: isDashed ? 'transparent' : 'transparent',
            strokeStyle: borderColor || '#666',
            lineWidth: 2,
            hidden: meta.hidden,
            index: i,
            pointStyle: 'rect',
            rotation: 0,
            datasetIndex: i,
          };
        });
      },
    },
    onClick(_e: unknown, legendItem: LegendItem, legend: { chart: Chart }) {
      const index = legendItem.index;
      if (index === undefined) return;

      const ci = legend.chart;
      const meta = ci.getDatasetMeta(index);
      const dataset = ci.data.datasets[index];

      if (meta.hidden) {
        ci.show(index);
        (dataset as unknown as Record<string, unknown>).borderDash = undefined;
      } else if (
        (((dataset as unknown as Record<string, unknown>).borderDash as number[] | undefined)?.length ?? 0) > 0
      ) {
        ci.hide(index);
      } else {
        (dataset as unknown as Record<string, unknown>).borderDash = [8, 4];
      }
      ci.update();
    },
  };
}
