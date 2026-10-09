import { isPublicCorsPath } from './cors.util';

describe('public CORS paths', () => {
  it('opens the MCP endpoint, its OAuth routes and discovery documents', () => {
    for (const url of [
      '/mcp',
      '/mcp?x=1',
      '/oauth/token',
      '/oauth/register',
      '/oauth/revoke',
      '/.well-known/oauth-protected-resource',
      '/.well-known/oauth-protected-resource/mcp',
      '/.well-known/oauth-authorization-server',
    ]) {
      expect(isPublicCorsPath(url)).toBe(true);
    }
  });

  it("keeps the app's routes, consent included, on its own origins", () => {
    for (const url of [
      '/mcp/connections',
      '/mcp/tokens',
      '/mcp/info',
      '/mcpx',
      '/oauth/authorize',
      '/oauth/authorize/details?client_id=a',
      '/event',
      '/auth/login',
    ]) {
      expect(isPublicCorsPath(url)).toBe(false);
    }
  });
});
