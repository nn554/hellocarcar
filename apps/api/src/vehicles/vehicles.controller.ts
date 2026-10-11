import { Controller, Get, Inject, Param, Query } from "@nestjs/common";
import { vehicleSearchSchema } from "@hellocarcar/contracts";
import { Public } from "../common/decorators";
import { parseWithSchema } from "../common/zod";
import { VehiclesService } from "./vehicles.service";

@Controller("v1/vehicles")
export class VehiclesController {
  constructor(@Inject(VehiclesService) private readonly vehicles: VehiclesService) {}

  @Public()
  @Get()
  search(@Query() query: unknown) {
    const input = parseWithSchema(vehicleSearchSchema, query);
    return this.vehicles.search({ ...input, marketCode: input.marketCode ?? "DZ" });
  }

  @Public()
  @Get(":id/prices")
  prices(@Param("id") id: string, @Query("marketCode") marketCode = "DZ") {
    return this.vehicles.prices(id, marketCode);
  }
}
