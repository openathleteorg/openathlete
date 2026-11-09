import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        O polimento é o trecho de treino mais leve antes da prova-alvo. A lógica
        é simples: semanas de treino pesado deixam você mais condicionado e
        também mais cansado, e o cansaço vai embora antes do condicionamento. Se
        você reduz a carga por um tempo, a fadiga some e a maior parte do que
        foi construído fica. Bem feito, você chega à largada mais descansado do
        que se sentiu em meses. Mal feito, porque cortou pouco ou descansou
        demais, você chega ainda cansado ou meio apagado.
      </p>

      <h2>O que dizem os estudos</h2>
      <p>
        Bosquet e colegas (2007) reuniram 27 estudos com atletas competitivos de
        corrida, ciclismo e natação. O padrão que funcionou melhor foi um
        polimento de cerca de duas semanas, com corte progressivo de 41 a 60% do
        volume, sem mudar a intensidade nem o número de treinos por semana.
        Mujika e Padilla (2003), revisando a literatura anterior, chegaram a uma
        receita parecida: manter a intensidade, reduzir bastante o volume, não
        cortar a frequência em mais de uns 20% e preferir uma redução
        progressiva a uma parada brusca. Eles situavam o ganho habitual em torno
        de 3%, numa faixa de 0,5 a 6%.
      </p>
      <p>
        Entre maratonistas amadores, Smyth e Lawlor (2021) analisaram os
        registros de mais de 158 mil corredores. Polimentos rigorosos, em que o
        volume cai semana após semana, foram associados a tempos melhores do que
        os mais soltos, e os rigorosos de três semanas foram os melhores, com
        ganho mediano de cerca de cinco minutos e meio (2,6%) em relação a um
        polimento mínimo. São dados observacionais: talvez os corredores mais
        disciplinados simplesmente façam um polimento melhor. Mas apontam na
        mesma direção dos experimentos.
      </p>

      <h2>O polimento no condicionamento, na fadiga e na forma</h2>
      <p>
        O{' '}
        <Link href="/pt-br/learn/ctl-atl-tsb">
          modelo condicionamento-fadiga
        </Link>{' '}
        mostra o mecanismo. O condicionamento (CTL) é uma média exponencial da
        carga diária com constante de tempo de 42 dias, a fadiga (ATL) uma média
        com constante de 7 dias, e a forma (TSB) é a diferença:
      </p>
      <Formula
        where={[
          'Peso diário da CTL = 1 − e^(−1/42) ≈ 0,024',
          'Peso diário da ATL = 1 − e^(−1/7) ≈ 0,133',
        ]}
      >
        CTL(hoje) = CTL(ontem) + (carga − CTL(ontem)) × 0,024
      </Formula>
      <p>
        Como a ATL reage cerca de cinco vezes e meia mais rápido que a CTL,
        reduzir a carga derruba a fadiga muito antes do condicionamento, e a TSB
        sobe. O polimento inteiro cabe nessa frase.
      </p>

      <h2>Um exemplo com contas</h2>
      <p>
        Um maratonista acaba de fazer três semanas com cerca de 560 de{' '}
        <Link href="/pt-br/learn/trimp">TRIMP</Link> por semana (uns 80 km no
        caso dele, 80 por dia em média), depois de uma base de 65 por dia. Para
        as contas ficarem legíveis, a carga é distribuída por igual em cada
        semana.
      </p>
      <ul>
        <li>Início do polimento: CTL 70,9, ATL 79,3, TSB −8,4.</li>
        <li>
          A duas semanas da prova, o volume cai 30% (cerca de 56 km, 56 por
          dia). No fim dessa semana: CTL 68,6, ATL 64,6, TSB +4,1.
        </li>
        <li>
          Semana da prova, volume em 45% do pico (cerca de 36 por dia, uns 30 km
          antes do dia da prova). Na véspera: CTL 64,3, ATL 48,1, TSB +16,2.
        </li>
      </ul>
      <p>
        Em duas semanas, a fadiga caiu 31 pontos e o condicionamento 6,6, cerca
        de 9%. Se o mesmo corredor tivesse parado totalmente nesses 13 dias, a
        CTL teria caído para perto de 52. O modelo é grosseiro, mas mostra por
        que se reduz o volume em vez de parar, e por que o efeito se concentra
        nos últimos dias.
      </p>

      <h2>Como fazer o polimento</h2>
      <ul>
        <li>
          Maratona: duas a três semanas. 10 km ou meia: uma a duas semanas.
          Prova secundária: três ou quatro dias mais leves.
        </li>
        <li>
          Reduza o volume aos poucos: 20 a 30% na primeira semana de um
          polimento de três, 40 a 60% na semana da prova. Encurte primeiro o
          longão.
        </li>
        <li>
          Mantenha o ritmo da semana e alguma intensidade. Por exemplo, 3 × 2 km
          no pace de maratona dez dias antes e 6 × 1 min um pouco mais rápido
          que o pace de prova quatro dias antes: as pernas continuam acostumadas
          à velocidade sem somar fadiga.
        </li>
        <li>
          Durma, coma normalmente e deixe tênis novo, gel novo e exercício de
          força novo para depois da prova.
        </li>
      </ul>
      <p>
        Na OpenAthlete você pode marcar essas semanas como um ciclo de treino na
        fase de polimento, e as{' '}
        <Link href="/pt-br/features/training-load">
          curvas de carga de treino
        </Link>{' '}
        são projetadas sobre as sessões planejadas: você vê a forma com que vai
        chegar ao dia da prova antes de fazer o primeiro treino do polimento.
      </p>

      <h2>Limites</h2>
      <p>
        Não existe uma TSB-alvo validada para o dia da prova: o número depende
        de como a carga é medida e do atleta, e os melhores polimentos dos
        estudos foram julgados pelo desempenho, não por uma curva. Um polimento
        não salva uma preparação curta demais, nem corrige em uma semana um
        excesso de treino acumulado. As sensações também enganam: pernas pesadas
        e ansiedade são comuns e costumam sumir na largada. Use as curvas para
        planejar e os treinos no pace de prova para avaliar.
      </p>
    </div>
  );
}
