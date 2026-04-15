import {
  CanvasEdge,
  CanvasGraph,
  CanvasNode,
  DAGValidationError,
  DAGValidationErrors,
} from '../../types/mission.types';

export interface DAGValidationResult {
  isValid: boolean;
  errors: DAGValidationErrors;
}

type AdjacencyMap = Map<string, string[]>;

enum Color {
  WHITE = 0,
  GRAY = 1,
  BLACK = 2,
}

export class DAGValidatorService {
  validate(graph: CanvasGraph, startNodeId?: string): DAGValidationResult {
    const errors: DAGValidationError[] = [];

    if (!graph.nodes || graph.nodes.length === 0) {
      return { isValid: true, errors };
    }

    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const adjacency = this.buildAdjacency(graph.nodes, graph.edges, nodeIds);

    errors.push(...this.detectDanglingEdges(graph.edges, nodeIds));
    errors.push(...this.detectCycles(graph.nodes, adjacency));
    errors.push(...this.detectDeadEnds(graph.nodes, adjacency));

    if (startNodeId && nodeIds.has(startNodeId)) {
      errors.push(
        ...this.detectUnreachableNodes(graph.nodes, adjacency, startNodeId),
      );
    }

    return { isValid: errors.length === 0, errors };
  }

  private buildAdjacency(
    nodes: CanvasNode[],
    edges: CanvasEdge[],
    nodeIds: Set<string>,
  ): AdjacencyMap {
    const adjacency: AdjacencyMap = new Map();
    for (const node of nodes) adjacency.set(node.id, []);
    for (const edge of edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
      adjacency.get(edge.source)!.push(edge.target);
    }
    return adjacency;
  }

  private detectDanglingEdges(
    edges: CanvasEdge[],
    nodeIds: Set<string>,
  ): DAGValidationError[] {
    const errors: DAGValidationError[] = [];
    for (const edge of edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push({
          nodeId: edge.source,
          errorType: 'MISSING_CONNECTION',
          message: `Edge '${edge.id}' references a source node '${edge.source}' that does not exist.`,
        });
      }
      if (!nodeIds.has(edge.target)) {
        errors.push({
          nodeId: edge.target,
          errorType: 'MISSING_CONNECTION',
          message: `Edge '${edge.id}' references a target node '${edge.target}' that does not exist.`,
        });
      }
    }
    return errors;
  }

  private detectCycles(
    nodes: CanvasNode[],
    adjacency: AdjacencyMap,
  ): DAGValidationError[] {
    const errors: DAGValidationError[] = [];
    const color = new Map<string, Color>();
    for (const node of nodes) color.set(node.id, Color.WHITE);

    const reported = new Set<string>();

    const visit = (nodeId: string): void => {
      const stack: Array<{ id: string; neighbours: string[]; index: number }> =
        [
          {
            id: nodeId,
            neighbours: adjacency.get(nodeId) ?? [],
            index: 0,
          },
        ];
      color.set(nodeId, Color.GRAY);

      while (stack.length > 0) {
        const frame = stack[stack.length - 1];
        if (frame.index >= frame.neighbours.length) {
          color.set(frame.id, Color.BLACK);
          stack.pop();
          continue;
        }
        const next = frame.neighbours[frame.index++];
        const nextColor = color.get(next) ?? Color.WHITE;
        if (nextColor === Color.GRAY) {
          if (!reported.has(next)) {
            reported.add(next);
            errors.push({
              nodeId: next,
              errorType: 'LOOP_DETECTED',
              message: `Cycle detected: node '${next}' is reachable from itself.`,
            });
          }
          continue;
        }
        if (nextColor === Color.WHITE) {
          color.set(next, Color.GRAY);
          stack.push({
            id: next,
            neighbours: adjacency.get(next) ?? [],
            index: 0,
          });
        }
      }
    };

    for (const node of nodes) {
      if (color.get(node.id) === Color.WHITE) visit(node.id);
    }

    return errors;
  }

  private detectDeadEnds(
    nodes: CanvasNode[],
    adjacency: AdjacencyMap,
  ): DAGValidationError[] {
    const errors: DAGValidationError[] = [];
    for (const node of nodes) {
      const out = adjacency.get(node.id) ?? [];
      if (out.length === 0 && !this.isTerminalNodeType(node)) {
        errors.push({
          nodeId: node.id,
          errorType: 'DEAD_END',
          message: `Node '${node.id}' has no outgoing edges and is not a terminal node.`,
        });
      }
    }
    return errors;
  }

  private detectUnreachableNodes(
    nodes: CanvasNode[],
    adjacency: AdjacencyMap,
    startNodeId: string,
  ): DAGValidationError[] {
    const errors: DAGValidationError[] = [];
    const visited = new Set<string>([startNodeId]);
    const queue: string[] = [startNodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const next of adjacency.get(current) ?? []) {
        if (visited.has(next)) continue;
        visited.add(next);
        queue.push(next);
      }
    }

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        errors.push({
          nodeId: node.id,
          errorType: 'UNREACHABLE_NODE',
          message: `Node '${node.id}' cannot be reached from start node '${startNodeId}'.`,
        });
      }
    }
    return errors;
  }

  private isTerminalNodeType(node: CanvasNode): boolean {
    return (
      node.type === 'Reward.Give' ||
      node.type === 'Flag.Set' ||
      node.type === 'Cinematic.Play'
    );
  }
}
