import Link from 'next/link';

import { pricesFor } from './prices';

const { quoted: q, coachYear } = pricesFor('pt-br');

export function ContentPtBr() {
  return (
    <div>
      <p>
        O TrainingPeaks é há muito tempo a plataforma padrão dos treinadores de
        endurance, e por bons motivos: o Performance Management Chart, um
        vocabulário (TSS, CTL, TSB) que meio mundo da corrida já fala, uma loja
        cheia de planilhas e apps maduros. Quem procura alternativa faz isso
        principalmente por dinheiro. A conta Basic gratuita não manda os treinos
        planejados para o relógio, e os treinadores pagam por cada atleta no
        Premium. Desde que a Garmin comprou o TrainingPeaks em 22 de julho de
        2026, alguns também querem uma plataforma que não pertença a um
        fabricante de relógios; esse assunto tem um post próprio,
        <Link href="/pt-br/blog/trainingpeaks-alternatives-after-garmin-acquisition">
          alternativas ao TrainingPeaks depois da compra pela Garmin
        </Link>
        . Este fica em preço e recursos.
      </p>
      <p>
        Este post compara quatro alternativas pelo que custam e pelo que fazem:
        intervals.icu, Nolio, Final Surge e OpenAthlete, que é a nossa. Os
        preços vêm da página de preços de cada empresa, conferida em 3 de
        novembro de 2026. Preços em dólar americano são sem impostos, como as
        empresas mostram.
      </p>

      <h2>Quanto custa o TrainingPeaks</h2>
      <p>
        Para um atleta, o Basic é grátis e o Premium custa {q('tpMonth')} por
        mês ou {q('tpYear')} por ano. Mandar treinos estruturados para o relógio
        é recurso do Premium, e é o principal motivo pelo qual quem treina
        sozinho passa a pagar.
      </p>
      <p>
        Para um treinador, o plano de entrada custa {q('tpCoach')} por mês, com
        quatro atletas Basic e um Premium. Cada atleta Premium a mais soma{' '}
        {q('tpPerMax')} por mês, caindo até {q('tpPerMin')} com volume, e há uma
        taxa de ativação de {q('tpSetup')}, dispensada com cupom. Na prática, um
        treinador cujos atletas precisam todos dos treinos no relógio paga cerca
        de {coachYear('trainingpeaks', 10)} por ano por dez atletas e{' '}
        {coachYear('trainingpeaks', 30)} por trinta, a não ser que os atletas
        paguem o próprio Premium.
      </p>

      <h2>O que comparar</h2>
      <p>
        As listas de recursos são todas parecidas. Quatro perguntas separam
        melhor essas plataformas:
      </p>
      <ul>
        <li>
          Os treinos planejados chegam ao relógio no plano gratuito, e para
          quais marcas?
        </li>
        <li>
          Como a carga de treino é calculada, e dá para ver a fórmula? Nenhuma
          alternativa usa TSS, então os números não vão bater com os que você
          conhece.
        </li>
        <li>Como o preço do treinador cresce com o número de atletas?</li>
        <li>
          Dá para levar seus dados embora, e o que acontece se a empresa fechar?
          O Today's Plan, uma plataforma de assessoria paga, fechou em março de
          2024 e os usuários tiveram que mudar todos os atletas de lugar.
        </li>
      </ul>

      <h2>intervals.icu</h2>
      <p>
        O intervals.icu é grátis, com um plano Supporter opcional de{' '}
        {q('icuMonth')} por mês ({q('icuYear')} por ano). É a opção mais forte
        desta lista em análise: curvas de potência, gráficos personalizados e a
        maior lista de integrações, incluindo Wahoo e Zwift para treinos, que o
        OpenAthlete não cobre. Treinar outros atletas é grátis; equipes e
        organizações precisam do Supporter. Não há apps oficiais (existem apps
        de terceiros) e o código é fechado. Se você treina sozinho e gosta de
        dados, comece por ele.
      </p>

      <h2>Nolio</h2>
      <p>
        A Nolio, empresa de Grenoble parceira da federação francesa de
        atletismo, tem um plano gratuito para atletas generoso, com
        sincronização com o relógio e treinos estruturados. O Premium custa{' '}
        {q('nolioPremium')} por mês. Os planos de treinador custam{' '}
        {q('nStarter')} por mês para 3 atletas, {q('nClassic')} para 25 e{' '}
        {q('nPro')} para 30 atletas e dois treinadores. Há planos para clubes,
        apps nativos e mais de 200 vídeos de exercícios. Não anuncia IA
        integrada e, como as outras, tem código fechado. Nossa{' '}
        <Link href="/pt-br/blog/nolio-vs-trainingpeaks-vs-openathlete-2025-comparison">
          comparação a três com o TrainingPeaks
        </Link>{' '}
        detalha o lado do treinador.
      </p>

      <h2>Final Surge</h2>
      <p>
        O Final Surge é grátis para atletas. Treinadores pagam um valor fixo de{' '}
        {q('fsStarter')} por mês de 1 a 5 atletas ou {q('fsPro')} até 100, sem
        cobrança por atleta. Os treinos estruturados vão para Garmin e COROS. É
        pensado para treinadores, escolas e clubes de corrida dos Estados
        Unidos, com desconto para escolas e apps nativos. Preço simples e
        honesto; menos profundidade na análise.
      </p>

      <h2>OpenAthlete</h2>
      <p>
        Todos os recursos são grátis nos nossos servidores: calendário, editor
        de treinos, envio de treinos para Garmin, Suunto e COROS, carga de
        treino e assessoria de até cinco atletas. O plano Supporter opcional (
        {q('oaMonth')} por mês ou {q('oaYear')} por ano) acrescenta IA com as
        nossas chaves e atletas ilimitados, e nada mais. O código é AGPL-3.0,
        então você também pode rodar no seu próprio servidor, de graça e sem
        limites. Os clubes também têm um espaço de clube gratuito, sem limite de
        atletas: grupos com seus treinadores, uma biblioteca de treinos
        compartilhada, treinos semanais do clube e planos copiados para um grupo
        inteiro.
      </p>
      <p>
        A carga de treino é o TRIMP de Banister calculado pela frequência
        cardíaca, com o RPE da sessão ao lado, e condicionamento, fadiga e forma
        são projetados sobre os treinos planejados. Os recursos de IA usam a sua
        própria chave (OpenAI, Anthropic, Mistral e outros) em qualquer plano:
        um treino estruturado a partir de uma frase, uma leitura curta de cada
        atividade e algumas perguntas depois de cada treino que registram
        esforço e dor para o treinador. Claude ou ChatGPT também podem planejar
        no calendário pelo servidor MCP.
      </p>
      <p>
        O que ainda não faz: os apps de iOS e Android estão em teste (enquanto
        isso, o app web pode ser instalado no celular), não há loja de
        planilhas, nem app de treino indoor, nem cobrança para clubes, e a
        análise de potência é menos profunda que no intervals.icu. Os treinos
        não vão para relógios Polar, porque a API da Polar é só de leitura. As
        unidades são apenas métricas.
      </p>

      <h2>Os números lado a lado</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Atleta que treina sozinho, treinos no relógio</th>
            <th>Treinador com 10 atletas, por ano</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>TrainingPeaks</td>
            <td>Premium, {q('tpYear')}/ano</td>
            <td>{coachYear('trainingpeaks', 10)} (atletas no Premium)</td>
          </tr>
          <tr>
            <td>intervals.icu</td>
            <td>Grátis (Supporter {q('icuYear')}/ano opcional)</td>
            <td>Grátis; equipes precisam do Supporter</td>
          </tr>
          <tr>
            <td>Nolio</td>
            <td>Grátis</td>
            <td>{coachYear('nolio', 10)} (Classic)</td>
          </tr>
          <tr>
            <td>Final Surge</td>
            <td>Grátis</td>
            <td>{coachYear('final-surge', 10)} (Pro)</td>
          </tr>
          <tr>
            <td>OpenAthlete</td>
            <td>Grátis</td>
            <td>{q('oaYear')} (Supporter)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Preços de tabela conferidos em 3 de novembro de 2026. As empresas mudam
        os preços: confira as páginas delas antes de decidir.
      </p>

      <h2>Qual combina com você</h2>
      <p>
        Fique no TrainingPeaks se você vende planilhas na loja dele, se seus
        atletas usam o TrainingPeaks Virtual ou se toda a sua assessoria é
        construída em cima do TSS e você não quer reaprender os números. Escolha
        o intervals.icu para a análise gratuita mais profunda, principalmente
        com medidor de potência. Escolha a Nolio se você treina um clube francês
        e quer preço para associações e apps nativos já. Escolha o Final Surge
        para uma equipe escolar ou clube dos Estados Unidos com preço fixo.
        Escolha o OpenAthlete se você quer os treinos no Garmin, Suunto ou COROS
        sem pagar, um preço fixo de treinador, IA com a sua chave, um espaço de
        clube gratuito ou um código que você mesmo pode hospedar.
      </p>

      <h2>Levando seu histórico</h2>
      <p>
        Suas atividades também estão na conta do seu relógio, que costuma ser a
        fonte mais fácil. No OpenAthlete, Strava e COROS trazem todo o seu
        histórico, Garmin e Suunto os últimos 30 dias, e Polar só o que você
        gravar depois de conectar; arquivos FIT, GPX e TCX antigos podem ser
        enviados em lote. Treinos planejados e planilhas não passam de uma
        plataforma para outra, então recrie seus treinos de sempre como modelos.
        Não verificamos nós mesmos a exportação em massa do TrainingPeaks, então
        confira a central de ajuda dele antes de contar com isso.
      </p>
      <p>
        Se quiser testar o OpenAthlete, a{' '}
        <Link href="/pt-br/pricing">página de preços</Link> mostra o que é
        grátis e o que o Supporter acrescenta.
      </p>
    </div>
  );
}
