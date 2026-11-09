import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Corra 90 minutos num ritmo leve e constante e a sua frequência cardíaca
        dificilmente vai ficar parada. Ela vai subindo: alguns batimentos na
        segunda hora, mais se estiver calor, mais ainda se longões são novidade
        para você. O desacoplamento aeróbico dá um número a essa subida. Ele
        compara o pace (ou a potência) que você obtém por batimento na primeira
        metade de um esforço contínuo com o da segunda metade. Joe Friel
        popularizou a medida entre atletas de endurance, e o TrainingPeaks a
        chama de Pa:HR para o pace e Pw:HR para a potência.
      </p>

      <h2>Como o desacoplamento é calculado</h2>
      <p>
        Divide-se a parte contínua do esforço em duas metades de mesma duração.
        Em cada uma, calcula-se o fator de eficiência (EF): produção média
        dividida pela frequência cardíaca média. Depois, a perda de uma metade
        para a outra é expressa em porcentagem:
      </p>
      <Formula
        where={[
          'EF = produção média / frequência cardíaca média, em cada metade',
          'Produção = velocidade ajustada à inclinação na corrida, potência no ciclismo',
        ]}
      >
        Desacoplamento (%) = (EF1 − EF2) / EF1 × 100
      </Formula>
      <p>
        Um valor positivo significa que você produziu menos por batimento na
        segunda metade: a frequência subiu no mesmo pace, ou o pace caiu com a
        mesma frequência. Se o percurso não é plano, a velocidade precisa ser
        ajustada à inclinação; senão, uma subida no final parece cansaço. A
        leitura usual, segundo Friel: abaixo de 5% é estável, entre 5% e 10% há
        alguma deriva, acima de 10% o esforço passou da sua resistência
        aeróbica.
      </p>

      <h2>Um exemplo com números</h2>
      <p>
        Um corredor faz 90 minutos num circuito plano a 5:20 por km, ou seja,
        187,5 metros por minuto.
      </p>
      <ul>
        <li>
          Primeiros 45 minutos: média de 142 bpm, então EF1 = 187,5 / 142 =
          1,320
        </li>
        <li>
          Últimos 45 minutos: mesmo pace, média de 150 bpm, então EF2 = 187,5 /
          150 = 1,250
        </li>
        <li>Desacoplamento = (1,320 − 1,250) / 1,320 × 100 = 5,3%</li>
      </ul>
      <p>
        Pouco acima de 5%: alguma deriva. Se a segunda metade tivesse média de
        146 bpm, o número seria 2,7%, tranquilamente estável. No ciclismo a
        conta é a mesma com watts: 200 W a 135 bpm e depois 195 W a 140 bpm dão
        EF de 1,48 e 1,39 e um desacoplamento de 6,0%. A potência caiu e a
        frequência subiu; as duas coisas contam contra você.
      </p>

      <h2>Como usar no treino</h2>
      <p>
        O desacoplamento é mais útil como teste repetível de resistência
        aeróbica durante a fase de base. Escolha um treino contínuo que você vai
        repetir: uma rodagem leve de 75 a 120 minutos no mesmo circuito plano,
        ou um pedal na parte baixa da sua zona de endurance. Fique sempre{' '}
        <Link href="/pt-br/tools/heart-rate-zones">
          na mesma zona de frequência cardíaca ou de potência
        </Link>{' '}
        e acompanhe o número ao longo das semanas.
      </p>
      <ul>
        <li>
          Se uma rodagem de 90 minutos passa de 5%, a duração ou o pace estão
          além da sua resistência atual. Mantenha o pace, ou reduza um pouco, e
          aumente a duração aos poucos.
        </li>
        <li>
          Quando ficar abaixo de 5%, aumente o treino ou termine com um bloco no
          pace de maratona para ver se ele se sustenta.
        </li>
        <li>
          Antes de uma maratona ou de um trail longo, um longão com trechos no
          pace de maratona que fica abaixo de 5% é um bom sinal. Uma deriva
          grande é motivo para rever o pace-alvo, ou a hidratação e a
          alimentação na prova.
        </li>
      </ul>
      <p>
        A OpenAthlete calcula o desacoplamento e o fator de eficiência em toda
        corrida com velocidade ajustada à inclinação e frequência cardíaca, e
        nos pedais com potência. Na página da atividade, você pode deixar o
        aquecimento de fora com um controle deslizante ou selecionar um trecho
        do esforço, e o card mostra as duas metades e um status: estável, alguma
        deriva ou deriva acentuada. Abaixo de 20 minutos, ele avisa que o
        esforço é curto demais para julgar a resistência.
      </p>

      <h2>Limites</h2>
      <p>
        O desacoplamento só faz sentido num esforço contínuo. Tiros, paradas em
        semáforos ou um final acelerado estragam a comparação. O calor é o maior
        fator de confusão: Coyle e González-Alonso (2001) descrevem como o
        aumento da temperatura do corpo faz a frequência cardíaca subir enquanto
        o volume bombeado a cada batimento cai, e a desidratação se soma a isso.
        Um desacoplamento de 7% numa tarde de 30 °C e de 3% numa manhã fresca
        podem descrever o mesmo condicionamento. Um sensor óptico de pulso que
        trava na cadência, uma cinta com os eletrodos secos ou um GPS que se
        perde embaixo das árvores distorcem uma das metades. Por fim, o
        desacoplamento não diz nada sobre velocidade: você pode estar
        perfeitamente acoplado num pace lento demais para o seu objetivo. Leia
        junto com o seu pace, a sua{' '}
        <Link href="/pt-br/learn/trimp">carga de treino</Link> e as condições do
        dia.
      </p>
    </div>
  );
}
