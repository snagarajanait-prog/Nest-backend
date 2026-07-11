import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { APP, MESSAGES, ROLES } from '../../common/constants/app.constants';
import { UserDocument } from '../users/schemas/user.schema';
import { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 10;

/** What login/register return to the controller. */
export interface AuthResult {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    phone: string;
    isActive: boolean;
  };
  accessToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    try {
      const alreadyExists = await this.usersService.existsByEmail(dto.email);
      if (alreadyExists) {
        throw new ConflictException(MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
      }

      // Every self-registered account gets the 'user' role.
      const role = await this.rolesService.findByName(ROLES.USER);
      const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

      const user = await this.usersService.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
        role: role._id,
        phone: dto.phone,
      });

      const result = this.buildAuthResult(user, ROLES.USER);
      // Fire-and-forget: a mail failure must never break registration.
      this.sendWelcomeEmailSafe(user.email, user.firstName);
      return result;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    try {
      const user = await this.usersService.findByEmailWithPassword(dto.email);
      if (!user) {
        throw new UnauthorizedException(MESSAGES.AUTH.INVALID_CREDENTIALS);
      }

      const passwordMatches = await bcrypt.compare(dto.password, user.password);
      if (!passwordMatches) {
        throw new UnauthorizedException(MESSAGES.AUTH.INVALID_CREDENTIALS);
      }

      if (!user.isActive) {
        throw new UnauthorizedException(MESSAGES.AUTH.ACCOUNT_DISABLED);
      }

      const roleName = this.extractRoleName(user);
      await this.usersService.updateLastLogin(user._id);

      return this.buildAuthResult(user, roleName);
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  private buildAuthResult(user: UserDocument, roleName: string): AuthResult {
    const payload: JwtPayload = {
      sub: String(user._id),
      email: user.email,
      role: roleName,
    };
    return {
      user: {
        id: String(user._id),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: roleName,
        phone: user.phone,
        isActive: user.isActive,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  /** After `.populate('role', 'name')` the role field is a `{ name }` object. */
  private extractRoleName(user: UserDocument): string {
    const populated = user.role as unknown as { name?: string } | null;
    return populated?.name ?? ROLES.USER;
  }

  /** Send the welcome email without blocking or failing registration. */
  private sendWelcomeEmailSafe(to: string, name: string): void {
    void this.mailService
      .sendTemplate({
        to,
        subject: MESSAGES.MAIL.WELCOME_SUBJECT,
        template: 'welcome',
        context: { name, appName: APP.NAME, year: new Date().getFullYear() },
      })
      .catch((error: unknown) =>
        this.logger.warn(
          `Welcome email could not be sent to ${to}`,
          error instanceof Error ? error.message : String(error),
        ),
      );
  }

  /** Preserve known HttpExceptions, wrap anything unexpected as a 500. */
  private normalizeError(error: unknown): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    this.logger.error(
      'Unexpected error in AuthService',
      error instanceof Error ? error.stack : String(error),
    );
    return new InternalServerErrorException(
      MESSAGES.GENERIC.SOMETHING_WENT_WRONG,
    );
  }
}
