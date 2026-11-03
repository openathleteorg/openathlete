import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Dois treinos, mesmo percurso, mesmo pace de 5:00/km, mesma frequência
        cardíaca média de 148 bpm. Na terça, você daria nota 3 de 10. Na quinta,
        depois de duas noites mal dormidas e um dia longo de trabalho, nota 6. O
        relógio arquiva os dois treinos como idênticos. O seu corpo, não.
      </p>

      <p>
        A frequência cardíaca e a percepção de esforço (RPE, de{' '}
        <em>rating of perceived exertion</em>) medem a carga interna: quanto o
        trabalho custou para você, em oposição à carga externa, que é o trabalho
        em si (distância, pace, potência). A distinção vem de Impellizzeri,
        Marcora e Coutts, para quem é a carga interna que gera a adaptação, e
        que defendem acompanhar as duas lado a lado (
        <a href="https://doi.org/10.1123/ijspp.2018-0935">
          Int J Sports Physiol Perform, 2019
        </a>
        ). Frequência cardíaca e RPE olham para a carga interna por ângulos
        diferentes, e discordam com frequência suficiente para que essa
        discordância valha a pena ser lida.
      </p>

      <h2>O que a frequência cardíaca realmente diz</h2>
      <p>
        A frequência cardíaca é a resposta cardiovascular ao trabalho. Em
        esforços contínuos de alguns minutos ou mais, ela acompanha bem a
        intensidade, e é por isso que zonas de frequência cardíaca e cargas do
        tipo TRIMP funcionam para a maior parte do treino de endurance. Mas ela
        não responde só à intensidade.
      </p>
      <p>
        Ela atrasa. No começo de um tiro de 4 minutos, leva um ou dois minutos
        para alcançar o esforço, então subestima tiros curtos e quase não diz
        nada de útil sobre um sprint de 30 segundos na subida. Ela deriva. Num
        longão em pace constante, sobe devagar à medida que o volume sistólico
        cai, mais ainda no calor ou com desidratação; Coyle e González-Alonso
        revisam os mecanismos (
        <a href="https://pubmed.ncbi.nlm.nih.gov/11337829/">
          Exerc Sport Sci Rev, 2001
        </a>
        ). Ela muda com cafeína, doença, altitude e estresse. E o número no
        pulso pode simplesmente estar errado: comparados a um ECG, sensores
        ópticos de pulso foram menos precisos que uma cinta peitoral, com
        precisão variando conforme o aparelho e a atividade (Gillinov et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/28709155/">
          Med Sci Sports Exerc, 2017
        </a>
        ).
      </p>

      <h2>O que a RPE acrescenta</h2>
      <p>
        A RPE é o resumo que o seu cérebro faz de tudo ao mesmo tempo:
        respiração, pernas, calor, motivação, quanta atenção o treino exigiu. O
        método da RPE da sessão de Carl Foster transforma isso num número de
        carga: dê uma nota ao treino inteiro na escala de Borg de 0 a 10 cerca
        de 30 minutos depois de terminar e multiplique pela duração em minutos
        (Foster et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/11708692/">
          J Strength Cond Res, 2001
        </a>
        ). Uma rodagem leve de 50 minutos com nota 3 dá 150 unidades
        arbitrárias; um treino de limiar de 70 minutos com 5 × 4' e nota 7 dá
        490.
      </p>
      <p>
        Na média, os dois métodos concordam. Em jovens jogadores de futebol, a
        carga pela RPE da sessão se correlacionou com três métodos baseados em
        frequência cardíaca, com correlações individuais entre cerca de 0,50 e
        0,85 (Impellizzeri et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/15179175/">
          Med Sci Sports Exerc, 2004
        </a>
        ). Em jovens esquiadores de cross-country, frequência cardíaca e PSE da
        sessão deram quase a mesma distribuição de intensidade, com cerca de
        três quartos dos treinos na zona leve (Seiler e Kjerland,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/16430681/">
          Scand J Med Sci Sports, 2006
        </a>
        ). Correlações nessa faixa também significam que as duas medidas se
        separam com frequência em treinos específicos. É aí que elas ficam
        úteis.
      </p>

      <h2>Como ler a discordância</h2>
      <p>
        <strong>Frequência cardíaca normal, RPE mais alta que o normal.</strong>{' '}
        O treino da quinta. O sistema cardiovascular fez o mesmo trabalho, mas o
        treino custou mais. Sono ruim, fadiga mental, fadiga acumulada e o
        início de uma doença aumentam a RPE antes de aparecer na frequência
        cardíaca. Um treino assim é ruído. Três rodagens assim na mesma semana
        são motivo para aliviar ou mudar de dia o próximo treino forte.
      </p>
      <p>
        <strong>Frequência cardíaca mais alta que o normal, RPE normal.</strong>{' '}
        Normalmente é o ambiente ou o sensor: calor, umidade, um café duplo, uma
        pulseira frouxa. Confira as condições antes de concluir qualquer coisa
        sobre o seu condicionamento. Se persistir em dias frescos, e
        principalmente com a frequência de repouso alta, considere uma doença
        chegando.
      </p>
      <p>
        <strong>
          Frequência cardíaca mais baixa que o normal, RPE mais alta.
        </strong>{' '}
        O padrão para levar a sério, especialmente se você não consegue mais
        subir o batimento nos tiros. É um dos sinais descritos em atletas em
        overreaching no consenso ECSS/ACSM sobre overtraining (Meeusen et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/23247672/">
          Med Sci Sports Exerc, 2013
        </a>
        ), embora o mesmo documento deixe claro que nenhum marcador isolado
        fecha o diagnóstico. Descanse alguns dias e veja se os dois valores
        voltam ao normal.
      </p>
      <p>
        <strong>Os dois mais baixos no mesmo pace.</strong> Você está evoluindo.
        Aproveite, e resista à vontade de acelerar todos os seus treinos leves.
      </p>

      <h2>Qual usar, e quando</h2>
      <p>
        Em rodagens e longões, um teto de frequência cardíaca é o jeito mais
        simples de manter os dias leves realmente leves, desde que você aceite a
        deriva na última hora. Em tiros de 5 minutos ou menos, use o pace ou a
        potência como alvo e a RPE como checagem: a frequência cardíaca chega
        tarde demais para guiar um tiro. Em provas e em dias longos na montanha,
        a RPE é a única medida que leva em conta o calor, a altimetria e os 40
        km que já estão nas pernas.
      </p>
      <p>
        Para a carga, fique com as duas. O TRIMP pela frequência cardíaca dá um
        número que não depende do seu humor; a RPE da sessão pega os treinos que
        o resto da sua vida deixou mais difíceis. Quando as duas tendências se
        afastam por uma semana ou mais, alguma coisa mudou fora do treino.
      </p>

      <h2>Nesta semana</h2>
      <p>
        Depois de cada treino, espere meia hora, pergunte a si mesmo «quão
        difícil foi o treino como um todo?» e anote um número de 0 a 10. Escreva
        ao lado a frequência cardíaca média. Escolha um percurso leve que você
        faz sempre e compare os pares no fim da semana. Não precisa de mais nada
        para começar a ver em quais dias a frequência cardíaca contava a
        história inteira e em quais não.
      </p>

      <p>
        O OpenAthlete guarda as duas em cada atividade: o TRIMP calculado com os
        dados cardíacos do seu relógio e, assim que você informa uma RPE, a
        carga pela RPE da sessão ao lado. Se você ativar os recursos de IA,
        algumas perguntas curtas depois de cada atividade preenchem a RPE e
        registram qualquer dor, para você ou para o seu treinador. É gratuito; a
        página de{' '}
        <Link href="/pt-br/features/training-load">carga de treino</Link>{' '}
        explica como os números são combinados, e a{' '}
        <Link href="/pt-br/tools/heart-rate-zones">
          calculadora de zonas de frequência cardíaca
        </Link>{' '}
        ajuda a definir suas zonas.
      </p>
    </div>
  );
}
