import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyTwoFactorInput,
} from "@zerox/shared";

export class RegisterDto implements RegisterInput {
  email!: string;
  password!: string;
  confirmPassword!: string;
}

export class LoginDto implements LoginInput {
  email!: string;
  password!: string;
  rememberMe!: boolean;
}

export class ForgotPasswordDto implements ForgotPasswordInput {
  email!: string;
}

export class ResetPasswordDto implements ResetPasswordInput {
  token!: string;
  password!: string;
  confirmPassword!: string;
}

export class VerifyTwoFactorDto implements VerifyTwoFactorInput {
  code!: string;
  tempToken!: string;
}
