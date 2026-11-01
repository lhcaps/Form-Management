import { Module } from '@nestjs/common';
import { FormsContractsModule } from '../forms-contracts/forms-contracts.module';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';
import { HealthController } from './health.controller';
import { ReadinessService } from './readiness.service';

@Module({
  imports: [FormsContractsModule, InfrastructureModule],
  controllers: [HealthController],
  providers: [ReadinessService],
})
export class HealthModule {}
