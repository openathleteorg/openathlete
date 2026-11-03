import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Um relógio de corrida moderno registra muita coisa: trajeto GPS, pace,
        frequência cardíaca, cadência, às vezes potência, além do sono e da
        variabilidade da frequência cardíaca durante a noite. Depois ele te
        entrega conclusões: um VO2máx estimado, um tempo de recuperação, uma
        pontuação de prontidão, um status de treino «produtivo» ou
        «improdutivo». As medições, em geral, são boas. É com as conclusões que
        é preciso cuidado, porque falta ao relógio quase tudo o que um treinador
        gostaria de saber.
      </p>

      <h2>O que o relógio mede e o que ele estima</h2>
      <p>
        Tempo, distância e pace pelo GPS são confiáveis o bastante para treinar,
        tirando prédios altos, mata fechada e curvas apertadas de pista. A
        frequência cardíaca é medida, mas a qualidade depende do sensor. Num
        estudo comparado ao ECG, sensores ópticos de pulso foram menos precisos
        que uma cinta peitoral, com precisão variando por aparelho e tipo de
        exercício (Gillinov et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/28709155/">
          Med Sci Sports Exerc, 2017
        </a>
        ). Na prática, o sensor óptico vai bem em rodagens contínuas e sofre nos
        tiros, no frio e com a pulseira frouxa.
      </p>
      <p>
        Todo o resto é estimativa construída sobre esses dados. As calorias são
        o exemplo mais claro: um estudo de Stanford com sete aparelhos de pulso
        viu que a maioria media a frequência cardíaca com erro mediano abaixo de
        5% na bicicleta, mas nenhum estimava o gasto energético com erro abaixo
        de 20% (Shcherbina et al.,{' '}
        <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5491979/">
          J Pers Med, 2017
        </a>
        ). VO2máx, tempo de recuperação e pontuações de prontidão saem de
        algoritmos proprietários que os fabricantes descrevem por alto, mas não
        publicam de um jeito que dê para verificar. Podem ser tendências úteis.
        Não são medições.
      </p>

      <h2>O que o relógio não sabe</h2>
      <p>
        Ele não sabe o que o treino deveria ser. Um 10 km a 4:45/km é um bom
        tempo run para um corredor e um erro para outro que tinha uma rodagem
        leve na planilha. Sem a planilha, não há com o que comparar.
      </p>
      <p>
        Ele não sabe como você se sentiu. A percepção de esforço costuma ser a
        primeira a mudar quando a fadiga se acumula, antes da frequência
        cardíaca ou do pace. Uma revisão sistemática mostrou que as medidas
        autorrelatadas dos atletas responderam à carga de treino com mais
        sensibilidade e consistência que marcadores objetivos, frequência de
        repouso incluída (Saw et al.,{' '}
        <a href="https://pubmed.ncbi.nlm.nih.gov/26423706/">
          Br J Sports Med, 2016
        </a>
        ). Alguns relógios já pedem uma nota no fim da corrida; se o seu pede,
        use.
      </p>
      <p>
        Ele não conhece a sua vida. A fadiga mental aumenta a percepção de
        esforço sem mudar frequência cardíaca nem lactato, pelo menos em
        laboratório (
        <a href="https://pubmed.ncbi.nlm.nih.gov/28044281/">
          Van Cutsem et al., Sports Med, 2017
        </a>
        ). Estresse no trabalho, um bebê recém-nascido, um voo longo: o relógio
        pode captar parte disso pelo sono e pela VFC, mas não tem como saber o
        porquê.
      </p>
      <p>
        Ele não sabe do incômodo no seu tendão de Aquiles, da prova daqui a oito
        semanas, nem que você está voltando depois de três semanas parado. Vai
        te chamar de «improdutivo» sem cerimônia em pleno polimento.
      </p>

      <h2>Use o relógio para o que ele faz bem</h2>
      <p>
        Confie nas medições, questione as conclusões. Para treinos em que a
        frequência cardíaca importa, uma cinta peitoral vale o investimento.
        Olhe as tendências de prontidão e VFC ao longo de uma semana ou mais,
        não como um veredito diário: uma pontuação baixa depois de uma boa noite
        de sono e com as pernas descansadas provavelmente é erro do algoritmo,
        não seu.
      </p>
      <p>
        Acrescente o contexto você mesmo. Depois de cada treino, uma nota de 0 a
        10 e uma linha de comentário («panturrilha travada», «calor, 28 °C»,
        «dormi mal») levam trinta segundos e deixam os seus dados legíveis um
        mês depois. Uma vez por semana, compare o que você fez com o que estava
        na planilha: treinos feitos, perdidos, alterados, e por quê.
      </p>
      <p>
        E guarde a planilha em algum lugar que não seja a sua cabeça. Os treinos
        sugeridos pelo relógio são montados a partir das estimativas dele e só
        conhecem o seu objetivo pelo que você cadastrou. Uma planilha feita por
        você ou por um treinador, com os treinos-chave encaixados na sua rotina,
        dá aos dados uma referência.
      </p>

      <h2>Nesta semana</h2>
      <p>
        Escolha uma estimativa do seu relógio (status de treino, tempo de
        recuperação ou prontidão) e anote todo dia ao lado da sua própria nota
        de 0 a 10 sobre o quanto você se sente descansado. No fim da semana,
        veja quantas vezes as duas concordaram. Você vai saber quanto peso dar a
        esse número.
      </p>

      <p>
        O OpenAthlete é uma plataforma gratuita que fica por cima do seu
        relógio: importa atividades de Garmin, COROS, Suunto, Polar e Strava (ou
        arquivos FIT, GPX e TCX), coloca cada uma ao lado do treino planejado e
        reúne no mesmo calendário a RPE, o TRIMP cardíaco e o sono e a VFC do
        seu aparelho. Treinos estruturados podem ser enviados para relógios
        Garmin, Suunto e COROS. Veja{' '}
        <Link href="/pt-br/features/watch-sync">
          sincronização com o relógio
        </Link>{' '}
        e <Link href="/pt-br/features/training-load">carga de treino</Link>.
      </p>
    </div>
  );
}
