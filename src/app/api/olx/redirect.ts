/**
 * O endereço de retorno do OAuth tem de ser EXACTAMENTE o que ficou registado
 * na aplicação do OLX. Por defeito é o domínio de onde o administrador carregou
 * no botão; `OLX_REDIRECT_URI` fixa-o quando o site tem mais de um domínio.
 */
export function olxRedirectUri(request: Request): string {
  return (
    process.env.OLX_REDIRECT_URI ||
    `${new URL(request.url).origin}/api/olx/callback`
  );
}

export const STATE_COOKIE = "olx_oauth_state";
