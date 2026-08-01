import { IsIn } from 'class-validator';

export type ClientDecision = 'ACHETER' | 'ABANDONNER';

export class ClientDecisionDto {
  @IsIn(['ACHETER', 'ABANDONNER'])
  decision: ClientDecision;
}
