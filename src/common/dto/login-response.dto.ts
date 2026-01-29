export class LoginResponseDto {
  token: string;
  doctor: {
    id: string;
    name: string;
    email: string;
    organizationId?: string;
    organizationName?: string;
  };
}
