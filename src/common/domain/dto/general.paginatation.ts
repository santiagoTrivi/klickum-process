import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';

export class PaginatedGeneralReponseDto extends PaginationDto<any> {
  @ApiProperty({})
  items: any[];
}
