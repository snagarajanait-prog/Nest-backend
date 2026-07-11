import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { MESSAGES } from '../../common/constants/app.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/register  -> 201 Created
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return { success: true, message: MESSAGES.AUTH.REGISTER_SUCCESS, data };
  }

  // POST /api/auth/login  -> 200 OK
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return { success: true, message: MESSAGES.AUTH.LOGIN_SUCCESS, data };
  }

  // GET /api/auth/profile  -> requires a valid Bearer token
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: AuthUser) {
    return { success: true, message: MESSAGES.USER.FETCHED, data: user };
  }
}
