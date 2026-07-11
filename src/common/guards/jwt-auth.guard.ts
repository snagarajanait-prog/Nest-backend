import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guards a route so only requests with a valid JWT Bearer token pass. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
