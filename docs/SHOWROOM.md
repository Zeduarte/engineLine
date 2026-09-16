# Funcionalidades públicas e pontos de venda

## Ativação

1. Aplicar `supabase/migrations/0018_showroom.sql` depois das migrações anteriores, no projeto Supabase correspondente. A migração acrescenta campos opcionais; anúncios existentes continuam como automóveis e sem mês de matrícula inventado.
2. Em **Admin → Página inicial**, editar pontos de venda reais, FAQs e páginas de serviços. Publicar apenas serviços efetivamente prestados. A página Oficina está inicialmente desativada.
3. No editor da viatura, selecionar automóvel/motociclo, categoria, mês da matrícula (opcional), ponto de venda e preço anterior (opcional). Os identificadores dos pontos são estáveis: reatribuir viaturas antes de os alterar/remover.
4. Para Google: ativar Places API (New) no Google Cloud, configurar faturação, restrições da chave e quotas. Definir `GOOGLE_PLACES_API_KEY` apenas no servidor; indicar Place ID e/ou ligação do perfil no editor. `SUPABASE_SERVICE_ROLE_KEY` e a migração dos limites de submissão já existentes são necessários para limitar pedidos. Não usar prefixo NEXT_PUBLIC para estas chaves.

## Comportamento

- Inventário: limites inclusivos de ano, quilómetros e preço; localização; tipo de veículo; apenas campanhas. Preço sob consulta fica fora de filtros numéricos de preço e campanhas.
- Preço anterior riscado apenas quando superior ao preço atual e o preço não é sob consulta.
- Contactos e ficha da viatura apresentam os pontos configurados; nomes são resolvidos pelo identificador, incluindo após renomear.
- Serviços desativados não aparecem na navegação das páginas de serviços nem no sitemap, e devolvem 404.
- FAQs são editáveis por categoria/página. Textos de serviços são texto simples, sem HTML executável.
- Google só é consultado após clique do visitante. Sem configuração/resposta válida, mantém-se a ligação ao perfil; não se inventam classificações. Não são armazenadas avaliações. São apresentados autores, ligações, atribuições e ordem por relevância do Google.
- Pedidos Google limitados pelo mecanismo persistente de submissões: 100 por 10 minutos globalmente e 10 por IP quando o cabeçalho de ingresso de confiança está configurado. Configurar também quotas no Google Cloud.
- Formulários públicos exigem confirmação da leitura da política no browser e no servidor. Não equivale a consentimento de marketing. Nos contactos é registada a versão/data da confirmação nos detalhes do pedido; testemunhos continuam sujeitos a aprovação.

## Verificação

Executar `npm ci`, `npm test`, `npm run lint`, `npm run typecheck` e `npm run build` com ambiente de teste. Os testes PostgreSQL locais usam PGlite, incluindo migrações, permissões, categorias de motociclos, matrícula e integridade de pontos de venda. Nenhuma migração é aplicada automaticamente pelo build.

A ativação na produção e testes com Google real exigem configuração do alojamento e dados reais do stand. Não colocar credenciais no repositório.

### Validação desta alteração

- 31 testes automatizados aprovados; TypeScript e ESLint sem erros.
- Build de produção concluído com dados de teste locais.
- 11 verificações HTTP aprovadas: inventário, serviços, financiamento, encomendas, oficina desativada (404), contactos, detalhe de automóvel e mota, ficha imprimível, sitemap e Google sem configuração.
- A verificação visual interativa não foi concluída: o navegador deste ambiente bloqueou o acesso ao servidor local. Não foram testadas credenciais Google reais nem aplicadas migrações no Supabase remoto.
