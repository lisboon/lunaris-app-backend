import { MemberRole } from '../enums';

export interface JwtPayloadData {
  userId: string;
  memberId: string;
  organizationId: string;
  role: MemberRole;
}

export interface JwtTokenService {
  sign(payload: JwtPayloadData): string;
  verify(token: string): JwtPayloadData;
}
