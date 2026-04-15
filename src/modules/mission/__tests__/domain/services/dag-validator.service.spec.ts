import { DAGValidatorService } from '../../../domain/services/dag-validator.service';
import { CanvasGraph } from '../../../types/mission.types';

const makeGraph = (
  nodes: Array<{ id: string; type?: string }>,
  edges: Array<{ source: string; target: string }>,
): CanvasGraph => ({
  nodes: nodes.map((n, i) => ({
    id: n.id,
    type: (n.type ?? 'Flow.Custom') as any,
    position: { x: i, y: i },
    data: {},
  })),
  edges: edges.map((e, i) => ({
    id: `e${i}`,
    source: e.source,
    target: e.target,
  })),
});

describe('DAGValidatorService', () => {
  const service = new DAGValidatorService();

  it('returns valid for an empty graph', () => {
    expect(service.validate({ nodes: [], edges: [] })).toEqual({
      isValid: true,
      errors: [],
    });
  });

  it('returns valid for a simple linear graph with terminal Reward.Give', () => {
    const graph = makeGraph(
      [
        { id: 'a' },
        { id: 'b' },
        { id: 'c', type: 'Reward.Give' },
      ],
      [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
      ],
    );
    const result = service.validate(graph, 'a');
    expect(result.isValid).toBe(true);
  });

  it('detects a simple cycle A → B → A without infinite-looping', () => {
    const graph = makeGraph(
      [{ id: 'a' }, { id: 'b' }],
      [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'a' },
      ],
    );
    const result = service.validate(graph);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.errorType === 'LOOP_DETECTED')).toBe(
      true,
    );
  });

  it('detects a self-loop A → A', () => {
    const graph = makeGraph([{ id: 'a' }], [{ source: 'a', target: 'a' }]);
    const result = service.validate(graph);
    expect(result.errors.some((e) => e.errorType === 'LOOP_DETECTED')).toBe(
      true,
    );
  });

  it('detects a deep cycle A → B → C → D → B', () => {
    const graph = makeGraph(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
      [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
        { source: 'c', target: 'd' },
        { source: 'd', target: 'b' },
      ],
    );
    const result = service.validate(graph);
    expect(result.errors.some((e) => e.errorType === 'LOOP_DETECTED')).toBe(
      true,
    );
  });

  it('detects dangling edges to missing nodes', () => {
    const graph = makeGraph(
      [{ id: 'a' }],
      [{ source: 'a', target: 'ghost' }],
    );
    const result = service.validate(graph);
    expect(
      result.errors.some((e) => e.errorType === 'MISSING_CONNECTION'),
    ).toBe(true);
  });

  it('detects dead-end non-terminal nodes', () => {
    const graph = makeGraph([{ id: 'a' }], []);
    const result = service.validate(graph);
    expect(result.errors.some((e) => e.errorType === 'DEAD_END')).toBe(true);
  });

  it('treats Reward.Give as a terminal node (no dead-end error)', () => {
    const graph = makeGraph([{ id: 'a', type: 'Reward.Give' }], []);
    const result = service.validate(graph);
    expect(result.errors.some((e) => e.errorType === 'DEAD_END')).toBe(false);
  });

  it('detects unreachable nodes when a start node is provided', () => {
    const graph = makeGraph(
      [
        { id: 'a', type: 'Reward.Give' },
        { id: 'orphan', type: 'Reward.Give' },
      ],
      [],
    );
    const result = service.validate(graph, 'a');
    expect(
      result.errors.some(
        (e) => e.errorType === 'UNREACHABLE_NODE' && e.nodeId === 'orphan',
      ),
    ).toBe(true);
  });
});
