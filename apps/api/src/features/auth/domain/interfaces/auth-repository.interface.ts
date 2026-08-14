import { AuthUserEntity } from "../entities/auth-user.entity";

export interface IAuthRepository {
  authenticate(email: string, password: string): Promise<AuthUserEntity>;
  getAuthUserById(userId: string): Promise<AuthUserEntity>;
  updateAuthUser(
    userId: string,
    updateAuthUserDto: any
  ): Promise<AuthUserEntity>;
}
