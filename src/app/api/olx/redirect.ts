/**
 * Endereço de retorno do OAuth do OLX.
 *
 * Por defeito NÃO se envia: a documentação do OLX diz que o `redirect_uri` é
 * opcional quando a aplicação tem um só Callback URL registado, e o OLX usa
 * esse. Enviá-lo fazia a firewall do OLX (CloudFront) recusar o pedido com 403
 * — um URL completo num parâmetro é o padrão de um ataque de redirecionamento,
 * e é bloqueado antes de chegar à página de autorização.
 *
 * `OLX_REDIRECT_URI` só é preciso se a aplicação tiver vários Callback URLs
 * registados; nesse caso tem de ser exatamente um deles.
 */
export function olxRedirectUri(): string | null {
  return process.env.OLX_REDIRECT_URI?.trim() || null;
}

export const STATE_COOKIE = "olx_oauth_state";
