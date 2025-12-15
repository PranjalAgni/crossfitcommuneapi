/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { AuthUser, AuthRole } from "./types";

const getBearer = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private jwks: ReturnType<typeof createRemoteJWKSet>;
  private issuer: string;
  private audience: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>("SUPABASE_URL");
    if (!supabaseUrl) {
      throw new Error("Missing SUPABASE_URL in environment");
    }

    // Supabase issuer is your project URL
    this.issuer = new URL("/auth/v1", supabaseUrl)
      .toString()
      .replace(/\/$/, "");
    this.audience =
      this.configService.get<string>("SUPABASE_JWT_AUD") ?? "authenticated";

    const jwksUrl = new URL("/auth/v1/.well-known/jwks.json", supabaseUrl);
    this.jwks = createRemoteJWKSet(jwksUrl);
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const authHeader =
      typeof req.headers["authorization"] === "string"
        ? req.headers["authorization"]
        : undefined;
    const token = getBearer(authHeader);

    if (!token) throw new UnauthorizedException("Missing bearer token");
    const [h] = token.split(".");
    console.log(JSON.parse(Buffer.from(h, "base64url").toString()));

    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
      });

      console.log("Payload:", payload);
      // payload.sub is the user id (uuid)
      const role: AuthRole | undefined =
        typeof payload.role === "string" &&
        (payload.role === "authenticated" || payload.role === "anon")
          ? payload.role
          : undefined;

      const user: AuthUser = {
        id: String(payload.sub),
        email: typeof payload.email === "string" ? payload.email : undefined,
        role,
      };

      req.user = user;
      req.accessToken = token; // useful for downstream if needed
      return true;
    } catch (error) {
      console.error("failed to verify token:", error);
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
