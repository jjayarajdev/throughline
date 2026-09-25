declare module 'react-gauge-chart' {
  import { ComponentType } from 'react';

  export interface GaugeChartProps {
    id?: string;
    className?: string;
    style?: React.CSSProperties;
    percent?: number;
    arcWidth?: number;
    arcPadding?: number;
    cornerRadius?: number;
    colors?: string[];
    textColor?: string;
    needleColor?: string;
    needleBaseColor?: string;
    hideText?: boolean;
    arcsLength?: number[];
    nrOfLevels?: number;
    animate?: boolean;
    formatTextValue?: (value: number) => string;
  }

  const GaugeChart: ComponentType<GaugeChartProps>;
  export default GaugeChart;
}