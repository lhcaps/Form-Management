import { Body, Controller, Param, Put } from '@nestjs/common';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { ContractFormInputsService } from './application/contract-form-inputs.service';

class SaveContractFormInputsDto {
  @IsString()
  @IsNotEmpty()
  contractHash!: string;

  @IsObject()
  data!: Record<string, unknown>;
}

@ApiTags('Runtime Forms')
@Controller('documents/generated')
export class ContractFormInputsController {
  constructor(private readonly inputs: ContractFormInputsService) {}

  @Put(':documentId/contract-form-inputs')
  save(
    @Param('documentId') documentId: string,
    @Body() body: SaveContractFormInputsDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.inputs.save(documentId, body, user);
  }
}
