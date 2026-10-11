import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AbilityFactory } from "./ability.factory";

@Module({ controllers: [AuthController], providers: [AuthService, AbilityFactory], exports: [AuthService, AbilityFactory] })
export class AuthModule {}
