import { Controller, Get, Req, Res } from "@nestjs/common";

import { Request, Response } from "express";

import { CsrfService } from "./csrf.service";
import { Public } from "./decorators/is-public.decorator";

@Controller("csrf")
export class CsrfController {
  constructor(private readonly csrfService: CsrfService) {}

  @Get("token")
  @Public()
  setCsrfToken(@Req() req: Request, @Res() res: Response) {
    this.csrfService.generateToken(req, res);
    res.status(200).send();
  }
}
