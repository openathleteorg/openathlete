import { Reflector } from '@nestjs/core';

import { UserRole } from '@openathlete/database';

export const UserTypes = Reflector.createDecorator<UserRole[]>();
