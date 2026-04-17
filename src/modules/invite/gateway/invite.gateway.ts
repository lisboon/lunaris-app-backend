import { Invite } from '../domain/invite.entity';

export interface InviteGateway {
  findById(id: string, organizationId: string): Promise<Invite | null>;
  findByToken(token: string): Promise<Invite | null>;
  findByEmailAndOrg(email: string, organizationId: string): Promise<Invite | null>;
  findByOrganization(organizationId: string): Promise<Invite[]>;
  create(invite: Invite): Promise<void>;
  update(invite: Invite): Promise<void>;
}