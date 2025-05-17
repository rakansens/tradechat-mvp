# Plugin Architecture for Chart

This project allows extending chart functionality through drawing tool and indicator plugins.

Plugins register themselves at runtime using the registries under `components/chart/plugins`.

## Drawing Tool Plugins

Create an object implementing `DrawingToolPlugin` from `components/chart/plugins/types` and register it with `registerDrawingTool`:

```ts
import { registerDrawingTool } from '@/components/chart/plugins/drawingToolRegistry';
import type { DrawingToolPlugin } from '@/components/chart/plugins/types';

const myTool: DrawingToolPlugin<MyOptions, MyHandle> = {
  id: 'myTool',
  draw(chart, series, options) { /* ... */ },
  remove(chart, series, handle) { /* ... */ }
};

registerDrawingTool(myTool);
```

## Indicator Plugins

Indicator plugins implement `IndicatorPlugin` and are registered via `registerIndicatorPlugin`:

```ts
import { registerIndicatorPlugin } from '@/components/chart/plugins/indicatorRegistry';
import type { IndicatorPlugin } from '@/components/chart/plugins/types';

const myIndicator: IndicatorPlugin<MyParams> = {
  id: 'myIndicator',
  calculate(data, params) { /* ... */ },
  addOrUpdate(chart, data, params, refs) { /* ... */ },
  remove(chart, refs) { /* ... */ }
};

registerIndicatorPlugin(myIndicator);
```

Once registered, hooks such as `useDrawingTools` and `useIndicators` retrieve plugins from the registries, so no core code changes are required to add new functionality.

