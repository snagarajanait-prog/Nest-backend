import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService, AuthResult } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user', async () => {
    const dto: RegisterDto = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'Password123!',
      phone: '1234567890',
    };
    const result: AuthResult = {
      user: {
        id: 'user-id',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        role: 'user',
        phone: '1234567890',
        isActive: true,
      },
      accessToken: 'token',
    };

    mockAuthService.register.mockResolvedValue(result);

    expect(await controller.register(dto)).toEqual({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
  });

  it('should login a user', async () => {
    const dto: LoginDto = {
      email: 'jane@example.com',
      password: 'Password123!',
    };
    const result: AuthResult = {
      user: {
        id: 'user-id',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        role: 'user',
        phone: '1234567890',
        isActive: true,
      },
      accessToken: 'token',
    };

    mockAuthService.login.mockResolvedValue(result);

    expect(await controller.login(dto)).toEqual({
      success: true,
      message: 'Login successful',
      data: result,
    });
    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
  });

  it('should return profile data', () => {
    const user: AuthUser = {
      userId: 'user-id',
      email: 'jane@example.com',
      role: 'user',
    };

    expect(controller.getProfile(user)).toEqual({
      success: true,
      message: 'User fetched successfully',
      data: user,
    });
  });
});
