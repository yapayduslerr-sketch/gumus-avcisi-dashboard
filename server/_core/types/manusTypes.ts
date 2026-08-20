export interface GetUserInfoWithJwtResponse {
  openId: string;
  projectId: string;
  name: string;
  email?: string | null;
  platform?: string | null;
  loginMethod?: string | null;
  taskUid?: string | null;
}

export interface VerifySessionResponse {
  openId: string;
  expiresAt?: string | null;
}
