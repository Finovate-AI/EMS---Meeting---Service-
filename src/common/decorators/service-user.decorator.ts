import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ServiceUserContext {
  id: string;
  // Additional IAM user fields can be attached here
  [key: string]: any;
}

export const CurrentServiceUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ServiceUserContext | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as ServiceUserContext | undefined;
  },
);
