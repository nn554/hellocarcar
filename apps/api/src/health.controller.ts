import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/decorators";

@Controller()
export class HealthController {
  @Public()
  @Get("health")
  health() {
    return {
      status: "ok",
      mode: "multi-market-foundation",
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      aiConfigured: Boolean(process.env.OPENAI_API_KEY),
      feishuConfigured: Boolean(process.env.FEISHU_READ_ONLY_TOKEN),
      nbsConfigured: Boolean(process.env.NBS_READ_ONLY_BASE_URL && process.env.NBS_READ_ONLY_TOKEN)
    };
  }
}
