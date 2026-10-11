import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { HttpEnvelopeInterceptor } from "./common/http-envelope.interceptor";
import { HttpExceptionEnvelopeFilter } from "./common/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.NODE_ENV === "production" ? (process.env.WEB_ORIGIN || false) : true,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"]
  });
  app.useGlobalInterceptors(new HttpEnvelopeInterceptor());
  app.useGlobalFilters(new HttpExceptionEnvelopeFilter());

  const swagger = new DocumentBuilder().setTitle("HelloCarCar API").setVersion("0.3.0").addCookieAuth(process.env.SESSION_COOKIE_NAME || "hcc_session").build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swagger));

  const port = Number(process.env.API_PORT || 8787);
  await app.listen(port, "127.0.0.1");
  console.log(`HelloCarCar API: http://127.0.0.1:${port}`);
}

void bootstrap();
