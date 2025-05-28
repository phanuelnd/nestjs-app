import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Geometry } from 'geojson';

export class CreateBuildingDto {
  @IsString()
  @IsNotEmpty()
  building_id: string;

  @IsOptional()
  footprint?: Geometry;
  
  @IsOptional()
  @IsUUID()
  parcel_id?: string;

  @IsOptional()
  @IsUUID()
  permit_id?: string;

  @IsOptional()
  @IsString()
  status?: string = 'pending';
}
