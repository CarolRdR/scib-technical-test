import type { Express } from 'express';
import { IsNotEmpty, IsString } from 'class-validator';

export class CandidateUploadDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  surname!: string;
}

export type CandidateUploadRequest = {
  name: string;
  surname: string;
  file: Express.Multer.File;
};
