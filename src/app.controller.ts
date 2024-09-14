import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Swagger API 문서 조회' })
  @ApiResponse({ status: 200, description: 'Swagger API 문서 반환' })
  getApiDocs(): string {
    return 'Swagger API 문서를 조회합니다.';
  }
}
