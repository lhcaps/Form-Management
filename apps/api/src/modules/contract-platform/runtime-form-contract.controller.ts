import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { RuntimeFormContractService } from './application/runtime-form-contract.service';

@ApiTags('Runtime Forms')
@Controller('forms/runtime')
export class RuntimeFormContractController {
  constructor(private readonly runtime: RuntimeFormContractService) {}

  @Get(':templateCode')
  get(
    @Param('templateCode') templateCode: string,
    @CurrentUser() user: CurrentUserType,
    @Query('contractHash') contractHash?: string,
  ) {
    return this.runtime.resolve(templateCode, user.agencyId, contractHash);
  }
}
