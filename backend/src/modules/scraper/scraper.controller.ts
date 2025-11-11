import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { IniciarConsultaDto } from './dto/iniciar-consulta.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ScraperSessionResponse } from './interfaces/scraper-session.interface';

@ApiTags('Scraper')
@Controller('scraper')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) { }

  @Post('consultas')
  @ApiOperation({
    summary: 'Iniciar consulta de cupom fiscal',
    description:
      'Inicia o processo de scraping de um cupom fiscal SAT a partir do QR Code. ' +
      'Retorna um session_id que deve ser usado para consultar o status.',
  })
  @ApiResponse({
    status: 201,
    description: 'Consulta iniciada com sucesso',
    schema: {
      example: {
        sessionId: 'abc-123-def-456',
        status: 'iniciando',
        progress: 0,
        createdAt: '2025-11-07T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Limite de consultas simultâneas atingido ou dados inválidos',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async iniciarConsulta(
    @Request() req,
    @Body() iniciarConsultaDto: IniciarConsultaDto,
  ): Promise<ScraperSessionResponse> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.sub;
    return this.scraperService.iniciarConsulta(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      userId,
      iniciarConsultaDto.qrcodeTexto,
    );
  }

  @Get('consultas/:sessionId')
  @ApiOperation({
    summary: 'Consultar status de uma sessão',
    description:
      'Retorna o status atual de uma consulta de cupom fiscal. ' +
      'Use polling (a cada 2-3 segundos) para acompanhar o progresso.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'ID da sessão retornado ao iniciar a consulta',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da sessão',
    schema: {
      example: {
        sessionId: 'abc-123-def-456',
        status: 'aguardando_captcha',
        progress: 50,
        createdAt: '2025-11-10T00:00:00.000Z',
        captchaUrl:
          'https://satsp.fazenda.sp.gov.br/COMSAT/Public/ConsultaPublica/ConsultaPublicaCfe.aspx',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Sessão não encontrada ou expirada',
  })
  async getStatus(
    @Param('sessionId') sessionId: string,
  ): Promise<ScraperSessionResponse> {
    return this.scraperService.getStatus(sessionId);
  }

  @Post('consultas/:sessionId/captcha-resolvido')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Notificar que CAPTCHA foi resolvido e cupom detectado',
    description:
      'Deve ser chamado pelo mobile após o usuário resolver o CAPTCHA e o cupom ser detectado. ' +
      'Pode opcionalmente enviar o HTML da página do cupom para processamento.',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiResponse({
    status: 200,
    description: 'Notificação recebida, processo continuando',
  })
  @ApiResponse({
    status: 400,
    description: 'Sessão não está aguardando CAPTCHA',
  })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  async notificarCaptchaResolvido(
    @Param('sessionId') sessionId: string,
    @Body() body: { cupomHtml?: string },
  ): Promise<{ message: string }> {
    await this.scraperService.notificarCaptchaResolvido(
      sessionId,
      body.cupomHtml,
    );
    return {
      message: 'CAPTCHA confirmado, processamento continuando',
    };
  }

  @Delete('consultas/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancelar uma consulta',
    description: 'Cancela uma consulta em andamento e encerra o processo.',
  })
  @ApiParam({ name: 'sessionId', description: 'ID da sessão' })
  @ApiResponse({ status: 204, description: 'Consulta cancelada' })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  async cancelar(@Param('sessionId') sessionId: string): Promise<void> {
    await this.scraperService.cancelar(sessionId);
  }

  @Get('minhas-consultas')
  @ApiOperation({
    summary: 'Listar consultas do usuário',
    description:
      'Retorna todas as consultas (ativas e recentes) do usuário autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de consultas',
    schema: {
      example: [
        {
          sessionId: 'abc-123-def-456',
          status: 'concluido',
          progress: 100,
          createdAt: '2025-11-07T00:00:00.000Z',
          compraId: 'xyz-789',
          totalProdutos: 3,
          valorTotal: 83.09,
        },
      ],
    },
  })
  async listarConsultas(@Request() req): Promise<ScraperSessionResponse[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.sub;
    return this.scraperService.listarSessoes(userId);
  }

  @Delete('minhas-consultas')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Limpar histórico de consultas do usuário',
    description:
      'Deleta todas as consultas (ativas e histórico) do usuário autenticado.',
  })
  @ApiResponse({
    status: 204,
    description: 'Histórico limpo com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async limparHistorico(@Request() req): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.sub;
    await this.scraperService.limparHistoricoUsuario(userId);
  }
}
