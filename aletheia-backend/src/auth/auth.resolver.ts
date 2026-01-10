import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => String)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    const user = await this.authService.validateUser(email, password);
    const result = this.authService.login(user);
    return result.access_token;
  }

  @Mutation(() => String)
  async register(
    @Args('email') email: string,
    @Args('name', { nullable: true }) name?: string,
  ) {
    const user = await this.authService.register(email, name);
    const result = this.authService.login(user);
    return result.access_token;
  }
}
