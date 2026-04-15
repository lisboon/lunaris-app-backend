export type NodeGameplayTag =
  | 'Spawn.Actor'
  | 'Objective.Kill'
  | 'Objective.Goto'
  | 'Objective.Collect'
  | 'Objective.Interact'
  | 'Condition.And'
  | 'Condition.Or'
  | 'Condition.Not'
  | 'Condition.Time'
  | 'Condition.Faction'
  | 'Dialogue.Tree'
  | 'Dialogue.Node'
  | 'Cinematic.Play'
  | 'Audio.Play'
  | 'Reward.Give'
  | 'Flag.Set'
  | 'Flow.Wait'
  | 'Flow.Branch'
  | 'Flow.Custom'
  | (string & {});

export interface CanvasNodePosition {
  x: number;
  y: number;
}

export interface CanvasNode {
  id: string;
  type: NodeGameplayTag;
  position: CanvasNodePosition;
  data: Record<string, unknown>;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface CanvasGraph {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface NodeDefinition {
  type: NodeGameplayTag;
  on_success?: string[];
  [nodeProperty: string]: unknown;
}

export interface MissionMeta {
  version: string;
  hash: string;
}

export interface MissionGraph {
  start_node: string;
  nodes: Record<string, NodeDefinition>;
}

export interface MissionContract {
  mission_id: string;
  meta: MissionMeta;
  graph: MissionGraph;
}

export type DAGErrorType =
  | 'LOOP_DETECTED'
  | 'DEAD_END'
  | 'MISSING_CONNECTION'
  | 'INVALID_NODE_TYPE'
  | 'UNREACHABLE_NODE';

export interface DAGValidationError {
  nodeId: string;
  errorType: DAGErrorType;
  message: string;
}

export type DAGValidationErrors = DAGValidationError[];
