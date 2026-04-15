import { MissionHashService } from '../../../domain/services/mission-hash.service';
import { MissionContract } from '../../../types/mission.types';

const contract: MissionContract = {
  mission_id: 'qst_old_country',
  meta: { version: '1.0.0', hash: '' },
  graph: { start_node: 'n1', nodes: { n1: { type: 'Objective.Goto' } } },
};

describe('MissionHashService', () => {
  const service = new MissionHashService();

  it('returns a 64-char hex SHA-256', () => {
    const hash = service.compute(contract);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic for identical contracts', () => {
    expect(service.compute(contract)).toBe(service.compute(contract));
  });

  it('changes when any field changes', () => {
    const other: MissionContract = {
      ...contract,
      graph: { ...contract.graph, start_node: 'n2' },
    };
    expect(service.compute(contract)).not.toBe(service.compute(other));
  });
});
