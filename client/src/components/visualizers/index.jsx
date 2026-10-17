import BoxModelVisualizer from './BoxModelVisualizer.jsx';
import DisplayVisualizer from './DisplayVisualizer.jsx';
import FlexboxVisualizer from './FlexboxVisualizer.jsx';
import GridVisualizer from './GridVisualizer.jsx';
import PositionVisualizer from './PositionVisualizer.jsx';
import SpecificityVisualizer from './SpecificityVisualizer.jsx';
import ColorVisualizer from './ColorVisualizer.jsx';
import TypographyVisualizer from './TypographyVisualizer.jsx';
import ResponsiveVisualizer from './ResponsiveVisualizer.jsx';
import AnimationVisualizer from './AnimationVisualizer.jsx';
import StackingVisualizer from './StackingVisualizer.jsx';
import SpacingVisualizer from './SpacingVisualizer.jsx';

export const visualizers = {
  'box-model': BoxModelVisualizer,
  display: DisplayVisualizer,
  flexbox: FlexboxVisualizer,
  grid: GridVisualizer,
  position: PositionVisualizer,
  specificity: SpecificityVisualizer,
  color: ColorVisualizer,
  typography: TypographyVisualizer,
  responsive: ResponsiveVisualizer,
  animation: AnimationVisualizer,
  stacking: StackingVisualizer,
  spacing: SpacingVisualizer,
};

export function renderVisualizer(key, config) {
  const Cmp = visualizers[key];
  if (!Cmp) return null;
  return <Cmp initial={config || {}} key={key} />;
}
