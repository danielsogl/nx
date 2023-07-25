import { VirtualElement } from '@floating-ui/react';
import { GraphService } from './graph';
import {
  TaskNodeTooltipProps,
  ProjectNodeToolTipProps,
  ProjectEdgeNodeTooltipProps,
} from '@nx/graph/ui-tooltips';
import { TooltipEvent } from './interfaces';

export class GraphTooltipService {
  private subscribers: Set<Function> = new Set();

  constructor(graph: GraphService) {
    graph.listen((event) => {
      switch (event.type) {
        case 'GraphRegenerated':
          this.hideAll();
          break;
        case 'BackgroundClick':
          this.hideAll();
          break;
        case 'ProjectNodeClick':
          const openConfigCallback =
            graph.renderMode === 'nx-console'
              ? () =>
                  graph.broadcast({
                    type: 'ProjectOpenConfigClick',
                    projectName: event.data.id,
                  })
              : undefined;
          this.openProjectNodeToolTip(event.ref, {
            id: event.data.id,
            tags: event.data.tags,
            type: event.data.type,
            description: event.data.description,
            openConfigCallback,
          });
          break;
        case 'TaskNodeClick':
          this.openTaskNodeTooltip(event.ref, {
            ...event.data,
          });
          break;
        case 'EdgeClick':
          const callback =
            graph.renderMode === 'nx-console'
              ? (url) =>
                  graph.broadcast({
                    type: 'FileLinkClick',
                    sourceRoot: event.data.sourceRoot,
                    file: url,
                  })
              : undefined;
          this.openEdgeToolTip(event.ref, {
            type: event.data.type,
            target: event.data.target,
            source: event.data.source,
            fileDependencies: event.data.fileDependencies,
            fileClickCallback: callback,
          });
          break;
      }
    });
  }

  currentTooltip: TooltipEvent;

  openProjectNodeToolTip(ref: VirtualElement, props: ProjectNodeToolTipProps) {
    this.currentTooltip = { type: 'projectNode', ref, props };
    this.broadcastChange();
  }

  openTaskNodeTooltip(ref: VirtualElement, props: TaskNodeTooltipProps) {
    this.currentTooltip = { type: 'taskNode', ref, props };
    this.broadcastChange();
  }

  openEdgeToolTip(ref: VirtualElement, props: ProjectEdgeNodeTooltipProps) {
    this.currentTooltip = {
      type: 'projectEdge',
      ref,
      props,
    };
    this.broadcastChange();
  }

  broadcastChange() {
    this.subscribers.forEach((subscriber) => subscriber(this.currentTooltip));
  }

  subscribe(callback: Function) {
    this.subscribers.add(callback);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  hideAll() {
    this.currentTooltip = null;
    this.broadcastChange();
  }
}
