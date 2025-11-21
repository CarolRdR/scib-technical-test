import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CandidatesModule } from './candidates/candidates.module';

@Module({
  imports: [CandidatesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
