import { apiService } from './api';
import { User } from '@/types/auth';

interface VerifyCodeRequest {
  email: string;
  code: string;
}

interface VerifyCodeResponse {
  access_token: string;
  user: User;
}

class VerificationService {
  async verifyCode(email: string, code: string): Promise<VerifyCodeResponse> {
    try {
      const response = await apiService.post<VerifyCodeResponse>('/auth/verify', {
        email,
        code: code.toUpperCase(),
      } as VerifyCodeRequest);

      return response;
    } catch (error) {
      throw this.handleVerificationError(error);
    }
  }

  private handleVerificationError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error('Error verifying code. Please try again');
  }
}

export const verificationService = new VerificationService();
