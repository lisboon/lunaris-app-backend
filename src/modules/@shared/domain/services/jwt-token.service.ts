export interface JwtPayloadData {
  userId: string;
  memberId: string;
  organizationId: string;
  role: string;
}

export interface JwtTokenService {
  sign(payload: JwtPayloadData): string;
  verify(token: string): JwtPayloadData;
}