import { describe, it, expect } from "vitest";
import { mapApplicationErrorToHttp } from "./error-to-http.mapper";
import {
  UserAlreadyExistsError,
  OAuthAuthenticationError,
  InvalidEmailError,
} from "../../../application/errors";

describe("mapApplicationErrorToHttp (identity)", () => {
  it("mapeia UserAlreadyExistsError para 409 e mensagem do erro", () => {
    const err = new UserAlreadyExistsError("User with this email already exists");
    const result = mapApplicationErrorToHttp(err);
    expect(result.statusCode).toBe(409);
    expect(result.message).toBe("User with this email already exists");
  });

  it("mapeia OAuthAuthenticationError para 401 e mensagem do erro", () => {
    const err = new OAuthAuthenticationError("OAuth authentication failed");
    const result = mapApplicationErrorToHttp(err);
    expect(result.statusCode).toBe(401);
    expect(result.message).toBe("OAuth authentication failed");
  });

  it("mapeia InvalidEmailError para 400 e mensagem do erro", () => {
    const err = new InvalidEmailError("Invalid email");
    const result = mapApplicationErrorToHttp(err);
    expect(result.statusCode).toBe(400);
    expect(result.message).toBe("Invalid email");
  });

  it("retorna 500 e mensagem genérica para erro não mapeado", () => {
    const err = new Error("Database connection failed");
    const result = mapApplicationErrorToHttp(err);
    expect(result.statusCode).toBe(500);
    expect(result.message).toBe("Internal server error");
  });
});
