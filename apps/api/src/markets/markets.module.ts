import { Global, Module } from "@nestjs/common";
import { MarketsController } from "./markets.controller";
import { MarketAccessService } from "./market-access.service";

@Global()
@Module({ controllers: [MarketsController], providers: [MarketAccessService], exports: [MarketAccessService] })
export class MarketsModule {}
