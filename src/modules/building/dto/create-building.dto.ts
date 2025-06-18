import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Geometry } from 'geojson';
import { Polygon } from 'geojson';

// DTO for creating a building
export class CreateBuildingDto {
      @IsString()
      @IsNotEmpty()
      building_id: string;

      @IsString()
      @IsOptional()
      parcel_id?: string;

      @IsString()
      @IsOptional()
      status?: string;

      @IsOptional()
      footprint?: Polygon;

      @IsOptional()
      longitude?: number;

      @IsOptional()
      latitude?: number;

      @IsString()
      @IsOptional()
      province?: string;

      @IsString()
      @IsOptional()
      sector?: string;

      @IsString()
      @IsOptional()
      district?: string;

      @IsString()
      @IsOptional()
      cell?: string;

      @IsString()
      @IsOptional()
      village?: string;

      @IsString()
      @IsOptional()
      data_source?: string;

  
}
