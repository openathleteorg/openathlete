import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        O OpenAthlete é uma plataforma de treino para atletas de endurance e
        seus treinadores. Tem um calendário com os treinos planejados, treinos
        estruturados que vão para o relógio, atividades que voltam dele, um
        modelo de carga de treino e um espaço compartilhado onde treinador e
        atleta trabalham na mesma planilha. O código é aberto, sob a licença
        AGPL-3.0. A versão hospedada é gratuita, e você também pode instalá-la
        no seu próprio servidor.
      </p>
      <p>
        Este texto explica por que ele existe, o que faz hoje e, tão útil
        quanto, o que ele não faz.
      </p>

      <h2>Por que ele existe</h2>
      <p>
        Por trás do OpenAthlete há um desenvolvedor independente de Grenoble, na
        França, que corre ultras. Não há investidores. O projeto nasceu de uma
        rotina conhecida: montar a temporada numa planilha, redigitar cada
        treino de tiros no app do fabricante do relógio e depois abrir um
        terceiro app para ver se o treino saiu como planejado. Três ferramentas,
        e nenhuma sabia das outras duas.
      </p>
      <p>
        As plataformas comerciais que resolvem isso são bons produtos. Elas
        também cobram dos treinadores por atleta e guardam anos de histórico nos
        servidores delas, nas condições delas. Quando o Today's Plan fechou, em
        março de 2024, seus usuários descobriram quanto desse histórico
        conseguiam levar de fato. Em julho de 2026 a Garmin comprou o
        TrainingPeaks, uma das plataformas de treinamento mais conhecidas, e as
        planilhas de muitos treinadores passaram a depender de um fabricante de
        relógios.
      </p>
      <p>
        A ideia do OpenAthlete é que o núcleo de uma plataforma de treino (um
        calendário, treinos estruturados, um modelo de carga, a conexão com o
        relógio) é infraestrutura. E infraestrutura funciona melhor quando
        qualquer pessoa pode ler, rodar e manter viva.
      </p>

      <h2>O que ele faz hoje</h2>
      <p>
        <strong>Planejamento.</strong> Você monta o treino passo a passo, por
        exemplo 15 minutos leves, 5 × 4 minutos no limiar com 2 minutos de
        trote, 10 minutos leves, e os alvos vêm das suas próprias zonas, paces
        ou porcentagens de VAM, FTP ou frequência cardíaca máxima. Os treinos
        ficam num calendário onde você arrasta as sessões, e o treinador pode
        mover ou copiar semanas inteiras de uma vez.
      </p>
      <p>
        <strong>Seu relógio.</strong> Os treinos planejados são enviados para
        relógios Garmin, Suunto e COROS. As atividades feitas chegam do Garmin,
        COROS, Suunto, Polar e Strava, ou de um arquivo FIT, GPX ou TCX. Ao
        conectar uma conta, Strava e COROS trazem todo o seu histórico, Garmin e
        Suunto os últimos 30 dias, e Polar só as atividades novas.
      </p>
      <p>
        <strong>Carga de treino.</strong> A carga é calculada com o TRIMP a
        partir da frequência cardíaca, com o RPE da sessão registrado ao lado.
        Condicionamento, fadiga e forma (CTL, ATL e TSB) são projetados sobre os
        treinos planejados, então você vê o que as próximas três semanas vão
        fazer com a sua forma antes da prova, e não depois. A página de{' '}
        <Link href="/pt-br/features/training-load">carga de treino</Link>{' '}
        explica o modelo.
      </p>
      <p>
        <strong>Assessoria.</strong> O treinador planeja direto no calendário de
        cada atleta, reaproveita modelos e vê o que foi feito de verdade. Um
        atleta pode ter mais de um treinador, e existe um chat em grupo.
        Acompanhar até cinco atletas é grátis.
      </p>
      <p>
        <strong>IA, se você quiser.</strong> Nada roda sem o seu consentimento,
        que você pode retirar quando quiser. Com ela ativada, a IA pode escrever
        um treino estruturado a partir de uma frase, alterar um treino com uma
        instrução curta, fazer três ou quatro perguntas depois de uma atividade
        e transformar suas respostas numa nota de esforço e num registro de dor
        que o seu treinador vê, dar uma leitura curta de cada atividade nova e
        estimar a carga de um treino planejado. Você usa sua própria chave de
        API (OpenAI, Anthropic, Google, Mistral e outras, ou um modelo local
        numa instância auto-hospedada) ou a cota incluída no plano Supporter.
        Não existe chat dentro do app: se quiser conversar, o{' '}
        <Link href="/pt-br/features/mcp-server">servidor MCP</Link> deixa o
        Claude ou o ChatGPT ler o seu treino e planejar sessões no seu
        calendário.
      </p>

      <h2>O que ele não faz</h2>
      <ul>
        <li>
          Os treinos não podem ser enviados para relógios Polar nem para o
          Strava. Os dois são apenas fontes de atividades.
        </li>
        <li>
          Não existe uma entidade de clube ou equipe. Um treinador pode planejar
          para vários atletas ao mesmo tempo, mas não há página nem
          administração de clube.
        </li>
        <li>
          Ele não prevê lesões. Registra a dor quando o atleta informa e mostra
          ao treinador, o que é menos impressionante e mais honesto.
        </li>
        <li>As unidades são apenas métricas.</li>
        <li>
          Os apps para iOS e Android estão em fase de testes. Enquanto isso, o
          app web funciona no celular e pode ser instalado na tela inicial.
        </li>
        <li>
          A conexão com o COROS é nova: pode haver alguma aresta, e vale avisar
          quando encontrar uma.
        </li>
      </ul>

      <h2>Como ele se paga</h2>
      <p>
        Todos os recursos são gratuitos na versão hospedada. O plano Supporter,
        a 5 € por mês ou 50 € por ano, acrescenta duas coisas: IA rodando nas
        chaves do OpenAthlete, com uma cota mensal, e acompanhar mais de cinco
        atletas. A auto-hospedagem é gratuita e sem limites. Os detalhes estão
        na <Link href="/pt-br/pricing">página de preços</Link>.
      </p>
      <p>
        A API e o banco de dados da versão hospedada rodam na OVH, na França, e
        o app web é servido pela Vercel. Uma instância auto-hospedada não envia
        nada ao OpenAthlete, e um teste automatizado confere isso a cada versão.
      </p>

      <h2>Por onde começar</h2>
      <p>
        Se você treina sozinho, conecte o relógio, defina suas zonas (a{' '}
        <Link href="/pt-br/tools/heart-rate-zones">
          calculadora de zonas de frequência cardíaca
        </Link>{' '}
        é um bom ponto de partida se você nunca mediu) e planeje uma semana. Se
        você é treinador, convide primeiro um único atleta e façam uma semana
        completa juntos antes de trazer todo mundo.
      </p>
      <p>
        O código-fonte está no{' '}
        <a href="https://github.com/openathleteorg/openathlete">GitHub</a>.
        Relatos de bugs e pedidos de recursos vão para lá ou para o Discord.
        Eles são lidos, e decidem boa parte do que será construído em seguida.
      </p>
    </div>
  );
}
