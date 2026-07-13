import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class TestMailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  to: string;

  @ApiPropertyOptional({ example: 'Alice' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'welcome', enum: ['welcome', 'reset-password', 'invoice'] })
  @IsOptional()
  @IsIn(['welcome', 'reset-password', 'invoice'])
  template?: 'welcome' | 'reset-password' | 'invoice';
}
