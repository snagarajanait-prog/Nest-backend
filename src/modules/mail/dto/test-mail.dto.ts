import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class TestMailDto {
  @IsEmail()
  to: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['welcome', 'reset-password', 'invoice'])
  template?: 'welcome' | 'reset-password' | 'invoice';
}
