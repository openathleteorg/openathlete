import Link from 'next/link';

import { articlePrices } from './prices';
import { SOURCES } from './sources';

export function ContentPtBr() {
  const p = articlePrices('pt-br');
  return (
    <div>
      <p>
        Em 22 de julho de 2026, a Garmin anunciou a compra do TrainingPeaks e do
        TrainHeroic, o app de treino de força do mesmo grupo, a Peaksware. Os
        valores não foram divulgados. Desde então, a mesma pergunta aparece nos
        fóruns de treinadores e na nossa caixa de entrada: devo trocar de
        plataforma? E, se sim, para qual?
      </p>
      <p>
        A resposta curta é que nada obriga você a trocar hoje. A longa vem a
        seguir, com as alternativas que valem um teste e o jeito de levar o seu
        histórico junto. Uma delas, o OpenAthlete, é feita por nós, então leia
        essa parte com o ceticismo que ela merece. As outras, tentamos descrever
        do jeito que os próprios usuários descreveriam.
      </p>

      <h2>O que mudou de verdade</h2>
      <p>
        O dono. Por enquanto, só isso. O{' '}
        <a href={SOURCES.garminPress}>comunicado da Garmin</a> diz que cerca de
        120 pessoas do TrainingPeaks e do TrainHeroic passam para a Garmin e que
        as plataformas continuam em Louisville, no Colorado. Não fala nada sobre
        contas, preços ou aparelhos compatíveis. Nenhuma mudança de preço foi
        anunciada para o Premium nem para o Coach Edition, e as contas de
        treinador funcionam como em junho. Alguns veículos, como o{' '}
        <a href={SOURCES.cyclelytic}>CycleLytic</a>, publicaram que a Garmin
        garantiu que a compatibilidade com outras marcas não vai mudar. Não
        encontramos esse compromisso por escrito da própria Garmin, mas também
        nada que aponte o contrário. Seus atletas com COROS, Suunto, Polar ou
        Wahoo continuam sincronizando.
      </p>
      <p>
        Então por que os treinadores estão perguntando? Principalmente por causa
        de quem define o rumo do produto agora. O valor do TrainingPeaks estava
        em ser a camada neutra entre todas as marcas de relógio e todos os
        treinadores. Agora é uma fabricante de relógios que decide onde os
        engenheiros vão trabalhar. A Garmin pode muito bem manter essa
        neutralidade, já que foi isso que ela comprou. Mesmo assim, quando
        comprou a Firstbeat em 2020, disse que o licenciamento para terceiros
        continuaria, e o <a href={SOURCES.the5krunner}>the5krunner</a>, citando
        o DC Rainmaker, observa que novos acordos não apareceram desde então.
        Isso não prova nada sobre o TrainingPeaks. Mas explica por que
        treinadores com atletas de várias marcas estão de olho.
      </p>
      <p>
        E existe um precedente. O Today&apos;s Plan pertencia à Specialized,
        tinha uma base fiel de treinadores de ciclismo e{' '}
        <a href={SOURCES.todaysPlan}>fechou em março de 2024</a>. Treinadores
        com anos de histórico lá tiveram poucos meses para tirar tudo. Ninguém
        espera o mesmo do TrainingPeaks, que é muito maior, mas quem passou por
        isso hoje sempre tem um plano de saída. E o preço já era assunto antes
        de julho: o Premium anual passou de US$ 124,99 para US$ 134,99 em abril
        de 2025.
      </p>

      <h2>Vale a pena trocar?</h2>
      <p>
        Para muita gente, a resposta honesta é não, ou ainda não. Passe por
        estes pontos antes de gastar um fim de semana migrando.
      </p>

      <h3>Os relógios dos seus atletas</h3>
      <p>
        Se todos os seus atletas usam Garmin, a compra é neutra para você,
        talvez até boa. Se um terço da sua turma usa COROS, Suunto ou Polar, é
        você quem precisa ficar atento. Faça a lista hoje: a marca de cada
        atleta e se os treinos planejados chegam ao relógio dele. É isso que
        você perderia primeiro se alguma integração piorasse um dia.
      </p>

      <h3>Quanto você paga</h3>
      <p>
        Preços de tabela em {p.checkedOn}: o TrainingPeaks Premium custa US$
        19,95 por mês ou {p.tpPremiumYear} por ano. O Coach Edition começa em
        US$ 21,99 por mês com um atleta Premium incluído, depois de US$ 9 a US$
        4,50 por mês para cada atleta Premium a mais, conforme o tamanho do
        grupo, mais uma taxa de adesão de US$ 99 que um código promocional zera
        (<a href={SOURCES.tpCoachPricing}>preços para treinadores</a>). Os
        treinos só vão para o relógio dos atletas Premium, então um treinador
        que paga o Premium de 10 atletas gasta cerca de {p.tpCoach10} por ano,
        sem impostos. Se você prefere ficar com esse dinheiro, é um motivo para
        olhar em volta, seja quem for o dono.
      </p>

      <h3>Do que você depende</h3>
      <p>
        Algumas coisas não têm equivalente de verdade. Se você vende planilhas
        no marketplace do TrainingPeaks, esse público não vai junto. Se seus
        atletas pedalam no rolo com o TrainingPeaks Virtual ou adoram os apps
        nativos, coloque isso na conta. E se os seus atletas estão satisfeitos e
        o único preocupado é você, mudar 25 pessoas por causa de um risco
        hipotético pode custar mais confiança do que economiza. Treinadores que
        tentaram contam que muitas vezes os atletas simplesmente dizem não.
      </p>

      <h3>Seus dados</h3>
      <p>
        Decida o que decidir, exporte o seu histórico agora. Leva uma noite e
        elimina quase todo o risco. O passo a passo está no fim do artigo.
      </p>

      <h2>As alternativas independentes</h2>
      <p>
        Nenhuma delas pertence a uma fabricante de relógios. Os preços são os de
        tabela de cada empresa em {p.checkedOn}; confira a página indicada antes
        de pagar.
      </p>

      <h3>intervals.icu</h3>
      <p>
        Gratuito, com um plano Supporter de US$ 4 por mês (
        <a href={SOURCES.intervals}>intervals.icu</a>). Para quem treina sozinho
        e gosta de dados, é a primeira parada: forma, fadiga e frescor, curvas
        de potência e de pace, editor de treinos, calendário e uma das maiores
        listas de integrações que existem (Garmin, COROS, Suunto, Polar, Wahoo,
        Zwift e muitas outras). Treinadores podem acompanhar atletas e montar
        treinos para eles; equipes e assessorias precisam do Supporter. Não há
        app móvel oficial (apps de terceiros cobrem a lacuna) e muita gente acha
        a interface carregada no começo. Se você vive olhando a curva de forma,
        comece por aqui.
      </p>

      <h3>Nolio</h3>
      <p>
        De Grenoble, parceiro da federação francesa de atletismo e padrão nos
        clubes franceses. Atletas são gratuitos (Premium a € 6,90 por mês); os
        planos para treinador começam em € 19,90 por mês para 3 atletas e €
        29,90 para até 25, com planos mais baratos para clubes que são
        associações (<a href={SOURCES.nolio}>preços Nolio</a>). Apps nativos
        para iOS e Android, biblioteca de vídeos de exercícios de força e
        comentários em cada treino. Para um treinador ou clube na França, é o
        substituto mais direto. É pouco conhecido no Brasil, cobra em euros, e o
        preço sobe por faixa conforme a turma cresce: {p.nolioCoach10} por ano
        para um treinador com 10 atletas.
      </p>

      <h3>Final Surge</h3>
      <p>
        Americano, popular entre treinadores de corrida, escolas e universidades
        dos Estados Unidos. Atletas têm todas as funções de graça; treinadores
        pagam um valor fixo de US$ 19 por mês para 1 a 5 atletas ou US$ 39 por
        mês para até 100 (<a href={SOURCES.finalSurge}>preços Final Surge</a>).
        Apps nativos e treinos estruturados enviados para Garmin e COROS. O
        valor fixo é o atrativo: 40 atletas custam o mesmo que 10. Pouca
        presença fora dos Estados Unidos e nenhuma função de IA que tenhamos
        encontrado, o que alguns treinadores vão considerar uma vantagem.
      </p>

      <h3>Tredict</h3>
      <p>
        Alemão, tocado pelo próprio fundador, cuidadoso com privacidade e o mais
        combativo em relação à compra pela Garmin (
        <a href={SOURCES.tredictBlog}>a análise deles</a>). Envia treinos para
        Garmin, COROS, Suunto, Wahoo, Hammerhead e Zwift, e tem funções para
        treinadores e uma API. O modelo de preço é diferente: US$ 49 uma única
        vez por doze meses de acesso completo, depois acesso gratuito só para
        leitura, e dois meses de teste (
        <a href={SOURCES.tredictPrice}>preços Tredict</a>). Equipe pequena e
        comunidade pequena, mas muito próximo, no espírito, do que o
        TrainingPeaks foi por muito tempo para muita gente.
      </p>

      <h3>Runalyze</h3>
      <p>
        Feito em Kaiserslautern e Kiel, e queridinho dos corredores que querem
        análise: VO2max efetivo, previsão de tempos de prova, um índice de forma
        para maratona e carga de treino. Sincroniza com Garmin, COROS, Suunto,
        Polar, Wahoo, Strava e outros. Gratuito, com Premium a € 60 por ano (
        <a href={SOURCES.runalyze}>preços Runalyze</a>). É um diário de treino e
        uma ferramenta de análise, mais do que uma plataforma de planejamento ou
        de assessoria: serve para o corredor que treina sozinho e usava o
        TrainingPeaks principalmente para olhar para trás, não para o treinador
        que monta planilhas para outros.
      </p>

      <h3>Golden Cheetah</h3>
      <p>
        Software de desktop livre e gratuito para Windows, macOS e Linux,
        pensado primeiro para o ciclismo, com uma análise de potência muito
        profunda (<a href={SOURCES.goldenCheetah}>goldencheetah.org</a>). Sem
        nuvem, sem colaboração com treinador, sem envio de treinos para o
        relógio. Está aqui porque ninguém nunca vai poder desligá-lo.
      </p>

      <h3>OpenAthlete</h3>
      <p>
        O nosso, então julgue levando isso em conta. É open source (AGPL),
        gratuito para hospedar por conta própria, ou hospedado por nós na
        França. Todas as funções são gratuitas na versão hospedada, incluindo a
        assessoria de até 5 atletas; o Supporter, a € 5 por mês ou € 50 por ano,
        acrescenta atletas ilimitados e IA com as nossas chaves (
        <Link href="/pt-br/pricing">preços</Link>). Os treinos planejados vão
        para relógios Garmin, Suunto e COROS; as atividades chegam dessas três
        marcas, da Polar e do Strava. A carga de treino é o TRIMP pela
        frequência cardíaca, com o RPE da sessão ao lado, e forma, fadiga e
        frescor são projetados sobre os treinos planejados. A IA é opcional e
        roda com a sua própria chave ou com a cota do Supporter.
      </p>
      <p>
        As limitações são reais. Ainda não há apps nativos nas lojas: os apps de
        iOS e Android estão em teste e, enquanto isso, os atletas usam o app web
        instalável. Não há marketplace para vender planilhas, nem conta de clube
        (um atleta pode ter vários treinadores, mas não existe uma organização
        com cobrança única), nem app de rolo, nem envio de treinos para relógios
        Polar. A análise é menos profunda que a do intervals.icu, e o projeto é
        jovem e desenvolvido por uma única pessoa. Nossa resposta para &quot;e
        se vocês sumirem?&quot; é a licença: o código e os seus dados continuam
        utilizáveis sem a gente. A comparação item por item está em{' '}
        <Link href="/pt-br/compare/trainingpeaks">
          OpenAthlete vs TrainingPeaks
        </Link>
        , como funciona a assessoria na{' '}
        <Link href="/pt-br/coaches">página para treinadores</Link>, e as outras
        comparações estão <Link href="/pt-br/compare">aqui</Link>.
      </p>

      <h2>Como trocar sem perder o histórico</h2>

      <h3>Exporte primeiro do TrainingPeaks</h3>
      <p>
        A central de ajuda do TrainingPeaks descreve uma função Export Data no
        app web: você escolhe um período de até 12 meses e recebe uma pasta com
        todos os arquivos de treino desse período; a mesma ferramenta gera um
        resumo em CSV dos treinos. Cada treino também pode ser baixado
        separadamente, no formato em que foi enviado (
        <a href={SOURCES.tpExportHelp}>Data Export</a>). Um{' '}
        <a href={SOURCES.tpExportBlog}>post do blog do TrainingPeaks</a> diz que
        a exportação em massa é para assinantes do Athlete Edition, e alguns
        usuários em fóruns dizem que ela exige o Premium, então confira o que
        aparece na sua conta. Seis anos de histórico são seis exportações. Faça
        isso antes de cancelar, não depois. Não encontramos uma forma
        documentada de exportar em massa a sua biblioteca de treinos ou a
        planilha futura, então conte com refazer os modelos que você reutiliza.
      </p>

      <h3>Reconecte as contas do relógio</h3>
      <p>
        A maioria das plataformas puxa as atividades antigas da marca do relógio
        quando você conecta a conta, o que dá menos trabalho que arquivos. Até
        onde dá para voltar depende mais da API da marca do que da plataforma.
        No OpenAthlete, Strava e COROS trazem o histórico completo (a COROS
        envia 50 arquivos por dia, então um histórico longo leva vários dias
        para chegar), Garmin e Suunto os últimos 30 dias, e a Polar nada
        anterior à conexão. Outras plataformas esbarram em limites parecidos
        pelos mesmos motivos; pergunte antes de contar com uma importação
        completa.
      </p>

      <h3>Complete com arquivos FIT</h3>
      <p>
        O que a API não devolve está na sua pasta exportada. Envie os arquivos
        FIT para a nova plataforma; no OpenAthlete dá para soltar vários de uma
        vez no calendário (20 MB por arquivo). Arquivos FIT multiesporte de um
        triatlo ainda não são suportados.
      </p>

      <h3>Use as duas durante um ciclo</h3>
      <p>
        Se você é treinador, mantenha o TrainingPeaks por mais um ciclo enquanto
        seus atletas se conectam à nova plataforma, monte lá as quatro semanas
        seguintes e veja o que dá errado. Trocar depois da prova alvo ou no
        começo do período de transição é bem mais fácil do que no meio de um
        ciclo de maratona.
      </p>
      <p>E se você for fazer uma coisa só este mês, que seja a exportação.</p>
    </div>
  );
}
