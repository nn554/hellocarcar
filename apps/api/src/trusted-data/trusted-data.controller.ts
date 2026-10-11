import { Body, Controller, Get, Inject, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createEligibilitySchema,
  createEvidenceSchema,
  createPolicySchema,
  createPolicyNewsSchema,
  createPriceObservationSchema,
  createSupplierCapabilitySchema,
  createSupplierSchema,
  trustedDataListQuerySchema,
  trustedDataResourceSchema,
  trustedDataTransitionSchema,
  updateEligibilitySchema,
  updateEvidenceSchema,
  updatePolicySchema,
  updatePolicyNewsSchema,
  updatePriceObservationSchema,
  updateSupplierCapabilitySchema,
  updateSupplierSchema
} from "@hellocarcar/contracts";
import type {
  SessionUser,
  CreatePolicyNewsInput,
  TrustedDataCreateInput,
  TrustedDataResource,
  TrustedDataUpdateInput
} from "@hellocarcar/contracts";
import { CurrentUser, Roles } from "../common/decorators";
import { parseWithSchema } from "../common/zod";
import { TrustedDataService } from "./trusted-data.service";

const parseCreateInput = (resource: TrustedDataResource, body: unknown): TrustedDataCreateInput => {
  switch (resource) {
    case "evidence": return parseWithSchema(createEvidenceSchema, body);
    case "policies": return parseWithSchema(createPolicySchema, body);
    case "policy-news": return parseWithSchema(createPolicyNewsSchema, body) as CreatePolicyNewsInput;
    case "eligibility": return parseWithSchema(createEligibilitySchema, body);
    case "suppliers": return parseWithSchema(createSupplierSchema, body);
    case "supplier-capabilities": return parseWithSchema(createSupplierCapabilitySchema, body);
    case "price-observations": return parseWithSchema(createPriceObservationSchema, body);
  }
};

const parseUpdateInput = (resource: TrustedDataResource, body: unknown): TrustedDataUpdateInput => {
  switch (resource) {
    case "evidence": return parseWithSchema(updateEvidenceSchema, body);
    case "policies": return parseWithSchema(updatePolicySchema, body);
    case "policy-news": return parseWithSchema(updatePolicyNewsSchema, body);
    case "eligibility": return parseWithSchema(updateEligibilitySchema, body);
    case "suppliers": return parseWithSchema(updateSupplierSchema, body);
    case "supplier-capabilities": return parseWithSchema(updateSupplierCapabilitySchema, body);
    case "price-observations": return parseWithSchema(updatePriceObservationSchema, body);
  }
};

@Roles("ANALYST", "ADMIN")
@Controller("v1/admin/trusted-data")
export class TrustedDataController {
  constructor(@Inject(TrustedDataService) private readonly trustedData: TrustedDataService) {}

  @Get("workspace-options")
  options(@CurrentUser() user: SessionUser, @Query() rawQuery: unknown) {
    const query = parseWithSchema(trustedDataListQuerySchema, rawQuery);
    return this.trustedData.options(user, query.marketCode ?? "DZ");
  }

  @Get(":resource")
  list(@CurrentUser() user: SessionUser, @Param("resource") rawResource: string, @Query() rawQuery: unknown) {
    const resource = parseWithSchema(trustedDataResourceSchema, rawResource);
    const query = parseWithSchema(trustedDataListQuerySchema, rawQuery);
    return this.trustedData.list(user, resource, {
      ...query,
      marketCode: query.marketCode ?? "DZ",
      reviewState: query.reviewState ?? "ALL",
      limit: query.limit ?? 25
    });
  }

  @Post(":resource")
  create(@CurrentUser() user: SessionUser, @Param("resource") rawResource: string, @Body() body: unknown) {
    const resource = parseWithSchema(trustedDataResourceSchema, rawResource);
    return this.trustedData.create(user, resource, parseCreateInput(resource, body));
  }

  @Patch(":resource/:id")
  update(
    @CurrentUser() user: SessionUser,
    @Param("resource") rawResource: string,
    @Param("id") id: string,
    @Query() rawQuery: unknown,
    @Body() body: unknown
  ) {
    const resource = parseWithSchema(trustedDataResourceSchema, rawResource);
    const query = parseWithSchema(trustedDataListQuerySchema, rawQuery);
    return this.trustedData.update(user, resource, id, query.marketCode ?? "DZ", parseUpdateInput(resource, body));
  }

  @Post(":resource/:id/transitions")
  transition(
    @CurrentUser() user: SessionUser,
    @Param("resource") rawResource: string,
    @Param("id") id: string,
    @Query() rawQuery: unknown,
    @Body() body: unknown
  ) {
    const resource = parseWithSchema(trustedDataResourceSchema, rawResource);
    const query = parseWithSchema(trustedDataListQuerySchema, rawQuery);
    const transition = parseWithSchema(trustedDataTransitionSchema, body);
    return this.trustedData.transition(user, resource, id, query.marketCode ?? "DZ", transition);
  }
}
