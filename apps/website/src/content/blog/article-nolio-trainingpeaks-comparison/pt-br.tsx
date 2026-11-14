import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('pt-br');

export function ContentPtBr() {
  return (
    <div>
      <p>
        Se você treina atletas de endurance na França, ou onde os clubes
        franceses ditam o padrão, a escolha costuma ficar entre TrainingPeaks e
        Nolio. Este post acrescenta o OpenAthlete, que é nosso, e compara os
        três do ponto de vista do treinador: quanto você paga quando a
        assessoria cresce, do que seus atletas precisam e o que cada um faz
        melhor que os outros. Os preços vêm da página de preços de cada empresa,
        conferida em 3 de novembro de 2026. Preços em dólar são sem impostos,
        como o TrainingPeaks mostra.
      </p>

      <h2>Três lógicas de preço</h2>
      <p>
        O <strong>TrainingPeaks</strong> cobra por atleta. O plano de treinador
        começa em {q('tpCoach')} por mês com quatro atletas Basic e um Premium;
        cada atleta Premium a mais custa {q('tpPerMax')} por mês, caindo até{' '}
        {q('tpPerMin')} com volume. Há uma taxa de ativação de {q('tpSetup')},
        dispensada com cupom. Os atletas podem ficar no Basic (
        {q('tpCoachUnlimited')} por mês cobrem quantos você quiser), mas aí os
        treinos planejados não chegam ao relógio, então a maioria dos
        treinadores paga o Premium ou pede que os atletas paguem {q('tpYear')}{' '}
        por ano do próprio bolso.
      </p>
      <p>
        A <strong>Nolio</strong> cobra por faixa. O Starter custa{' '}
        {q('nStarter')} por mês para 3 atletas, o Classic {q('nClassic')} para
        25 e o Pro {q('nPro')} para 30 atletas e dois treinadores; um treinador
        a mais custa {q('nExtraCoach')} por mês. Os atletas não pagam pela
        sincronização com o relógio: o plano gratuito inclui. Os clubes têm
        planos próprios, Club Starter a {q('nClubStarter')} e Club Classic a{' '}
        {q('nClubClassic')} por mês.
      </p>
      <p>
        O <strong>OpenAthlete</strong> é grátis até cinco atletas. Acima disso,
        o plano Supporter a {q('oaYear')} por ano tira o limite, seja qual for o
        tamanho da assessoria, e ainda acrescenta IA com as nossas chaves. A
        sincronização com o relógio é grátis para os atletas. Hospedar no seu
        próprio servidor é grátis e sem limites. Os clubes têm um espaço de
        clube gratuito, e os atletas que um treinador acompanha por meio de um
        clube não contam entre os cinco.
      </p>

      <table>
        <thead>
          <tr>
            <th>Atletas</th>
            <th>TrainingPeaks (atletas no Premium)</th>
            <th>Nolio</th>
            <th>OpenAthlete</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>3</td>
            <td>{coachYear('trainingpeaks', 3)}</td>
            <td>{coachYear('nolio', 3)} (Starter)</td>
            <td>Grátis</td>
          </tr>
          <tr>
            <td>10</td>
            <td>{coachYear('trainingpeaks', 10)}</td>
            <td>{coachYear('nolio', 10)} (Classic)</td>
            <td>{q('oaYear')}</td>
          </tr>
          <tr>
            <td>25</td>
            <td>{coachYear('trainingpeaks', 25)}</td>
            <td>{coachYear('nolio', 25)} (Classic)</td>
            <td>{q('oaYear')}</td>
          </tr>
          <tr>
            <td>30</td>
            <td>{coachYear('trainingpeaks', 30)}</td>
            <td>{coachYear('nolio', 30)} (Pro)</td>
            <td>{q('oaYear')}</td>
          </tr>
        </tbody>
      </table>
      <p>
        Custo anual para um treinador, cobrança mensal, preços de tabela
        conferidos em 3 de novembro de 2026. A coluna do TrainingPeaks supõe que
        o treinador paga o Premium de cada atleta; se seus atletas já pagam o
        deles, a sua conta fica bem menor.
      </p>

      <h2>O que cada um faz melhor</h2>
      <p>
        O <strong>TrainingPeaks</strong> é a língua comum. Muitos atletas chegam
        com conta e histórico lá, muitos treinadores pensam em TSS e no
        Performance Management Chart, e se você vende planilhas, a loja dele as
        coloca na frente de compradores. Os apps são maduros e o TrainingPeaks
        Virtual cobre o rolo. Desde 22 de julho de 2026 ele pertence à Garmin; o
        que isso pode mudar está em
        <Link href="/pt-br/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          alternativas ao TrainingPeaks depois da compra pela Garmin
        </Link>
        .
      </p>
      <p>
        A <strong>Nolio</strong> é feita para clubes franceses. É uma empresa de
        Grenoble, parceira da federação francesa de atletismo, com preço para
        associações, vários treinadores na mesma conta, apps nativos de iOS e
        Android e uma biblioteca com mais de 200 vídeos de exercícios de força.
        Se o seu clube quer uma conta só para três treinadores e sessenta
        associados, com apps nativos em cada celular, a Nolio tem um plano feito
        para isso.
      </p>
      <p>
        O <strong>OpenAthlete</strong> mantém preço fixo e acrescenta algumas
        coisas que os outros dois não anunciam. A IA roda com a sua própria
        chave (ou a cota do Supporter): você escreve "10 km leve e depois 6 ×
        400 m no pace de 5 km" e recebe um treino estruturado com as zonas do
        atleta; depois de cada atividade, o atleta recebe uma leitura curta e
        algumas perguntas, e o esforço e qualquer dor relatada vão para um
        registro de lesões e para o seu painel. Pelo servidor MCP, Claude ou
        ChatGPT podem ler o treino de um atleta e planejar até 60 treinos no
        calendário dele. Os clubes têm um espaço de clube gratuito sem limite de
        atletas: grupos com seus treinadores, uma biblioteca compartilhada,
        treinos semanais do clube que os atletas confirmam, e um treino, um dia
        ou uma semana copiados para um grupo inteiro, adaptados às zonas de cada
        um. O código é AGPL-3.0, então um clube também pode rodar a própria
        instância, com login único (SSO) e cadastro só por convite.
      </p>

      <h2>O que falta em cada um</h2>
      <p>
        O TrainingPeaks não lista IA integrada nas páginas de preço, e a
        cobrança por atleta sobe rápido se você paga o Premium. Os planos de
        treinador da Nolio são pagos desde o primeiro atleta e ela não anuncia
        IA. Nenhum dos dois é open source.
      </p>
      <p>
        As lacunas do OpenAthlete também são reais. Os apps de iOS e Android
        estão em teste, então por enquanto os atletas usam o app web instalável.
        O espaço de clube não tem cobrança para o clube: as mensalidades ficam
        fora do OpenAthlete. Sem loja, sem biblioteca de vídeos, sem parceria
        com federação. Os treinos vão para relógios Garmin, Suunto e COROS, não
        Polar. A carga é o TRIMP de Banister pela frequência cardíaca, com o RPE
        da sessão ao lado, então os números não vão bater com o TSS se seus
        atletas vêm do TrainingPeaks.
      </p>

      <h2>Três treinadores, três respostas</h2>
      <p>
        Um treinador autônomo com doze corredores usando vários Forerunner, um
        COROS Pace e um Suunto: aqui o TrainingPeaks sai mais caro, a não ser
        que os atletas paguem o próprio Premium. Nolio Classic e OpenAthlete dão
        conta; a diferença fica entre {coachYear('nolio', 12)} e {q('oaYear')}{' '}
        por ano, IA de um lado e apps nativos do outro.
      </p>
      <p>
        Um clube com três treinadores e sessenta associados: se eles querem um
        app nativo no celular agora, os planos de clube da Nolio servem melhor.
        Se o app web instalável basta, o espaço de clube do OpenAthlete resolve
        de graça, com grupos, uma biblioteca compartilhada e a pista de terça já
        no calendário de cada associado. Uma instância própria é uma opção se
        alguém do clube topar cuidar de um servidor.
      </p>
      <p>
        Um treinador que vende planilhas para atletas com quem nunca fala: fique
        no TrainingPeaks. Nem a Nolio nem o OpenAthlete têm loja.
      </p>
      <p>
        Mais detalhes, com fonte para cada afirmação, nas páginas{' '}
        <Link href="/pt-br/compare/nolio">OpenAthlete vs Nolio</Link> e{' '}
        <Link href="/pt-br/compare/trainingpeaks">
          OpenAthlete vs TrainingPeaks
        </Link>
        , e o que o OpenAthlete oferece aos treinadores na{' '}
        <Link href="/pt-br/coaches">página para treinadores</Link>.
      </p>
    </div>
  );
}
