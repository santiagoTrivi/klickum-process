import { Type } from 'class-transformer';
import { ArrayUnique, IsEnum, IsString, ValidateNested } from 'class-validator';
import { Resource } from '../resource.enum';
import { Action } from '../action.enum';

export class CreateRoleDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => Permission)
  permissions: Permission[];
}

export class Permission {
  @IsEnum(Action, { each: true })
  @ArrayUnique()
  action: Action;
}
