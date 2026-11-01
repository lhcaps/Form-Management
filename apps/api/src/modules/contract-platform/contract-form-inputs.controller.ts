import { Body, Controller, Param, Put } from '@nestjs/common';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { GeneratedInputSaveOrchestrator } from '../documents/rendering/application/generated-input-save-core/generated-input-save.orchestrator';

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
  constructor(
    private readonly generatedInputSave: GeneratedInputSaveOrchestrator,
  ) {}

  @Put(':documentId/contract-form-inputs')
  save(
    @Param('documentId') documentId: string,
    @Body() body: SaveContractFormInputsDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.generatedInputSave
      .save({
        intent: 'GENERATED_SAVE_CONTRACT_INPUTS',
        documentId,
        actor: user,
        body,
      })
      .then((envelope) => envelope.result);
  }
}
