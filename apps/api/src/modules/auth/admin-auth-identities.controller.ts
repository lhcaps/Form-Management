import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from './current-user.decorator';
import type { CurrentUser as CurrentUserType } from './current-user.type';
import {
  AdminAuthIdentitiesService,
  type IdentitySummary,
  type OfficialSearchResult,
  type PaginatedResult,
} from './admin-auth-identities.service';
import {
  LinkIdentityDto,
  ListIdentitiesDto,
  SearchOfficialsDto,
  UnlinkIdentityDto,
} from './dto/admin-auth-identities.dto';

@ApiTags('Admin Auth Identities')
@Controller('admin/auth/identities')
export class AdminAuthIdentitiesController {
  constructor(private readonly service: AdminAuthIdentitiesService) {}

  @Get()
  async list(
    @CurrentUser() user: CurrentUserType,
    @Query() dto: ListIdentitiesDto,
  ): Promise<PaginatedResult<IdentitySummary>> {
    return this.service.listIdentities(user, dto);
  }

  @Get('officials/search')
  async searchOfficials(
    @CurrentUser() user: CurrentUserType,
    @Query() dto: SearchOfficialsDto,
  ): Promise<PaginatedResult<OfficialSearchResult>> {
    return this.service.searchActiveOfficials(user, dto);
  }

  @Post(':id/link')
  async link(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: LinkIdentityDto,
  ): Promise<IdentitySummary> {
    return this.service.linkIdentity(user, id, dto);
  }

  @Post(':id/unlink')
  async unlink(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UnlinkIdentityDto,
  ): Promise<IdentitySummary> {
    return this.service.unlinkIdentity(user, id, dto);
  }
}
