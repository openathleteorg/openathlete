import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Coloque seus melhores tempos entre alguns minutos e uns vinte num
        gráfico de distância por tempo e os pontos caem quase numa reta. A
        inclinação dela é a sua velocidade crítica: os metros que você soma a
        cada segundo a mais de esforço. A reta não sai do zero. Ela corta o eixo
        das distâncias um pouco acima, num valor chamado D′ (D linha): uma
        quantidade fixa de distância que você consegue percorrer mais rápido que
        a velocidade crítica antes de precisar desacelerar.
      </p>
      <p>
        A ideia vem de Monod e Scherrer (1965), que a descreveram para o
        trabalho de um grupo muscular com o nome de potência crítica. Na corrida
        ela vale do mesmo jeito, com velocidade no lugar de potência e distância
        no lugar de trabalho. Do ponto de vista fisiológico, a velocidade
        crítica é a fronteira entre os esforços em que o consumo de oxigênio e o
        lactato se estabilizam e aqueles em que continuam subindo até você parar
        (Poole et al., 2016). Ela fica perto do máximo estado estável de
        lactato, um pouco acima, que é o que o{' '}
        <Link href="/pt-br/learn/lactate-threshold">limiar de lactato</Link>{' '}
        tenta estimar.
      </p>

      <h2>Como a velocidade crítica é calculada</h2>
      <Formula
        where={[
          'd = distância de um melhor esforço (m), t = sua duração (s)',
          'VC = velocidade crítica (m/s), D′ = distância acima da VC (m)',
          'Acima da VC: tempo até a exaustão t = D′ / (v − VC)',
        ]}
      >
        d = D′ + VC × t
      </Formula>
      <p>
        Com dois esforços máximos, a reta se resolve à mão. Com três ou mais,
        ela é ajustada por mínimos quadrados, e a dispersão dos pontos mostra o
        quanto confiar na inclinação. Os esforços devem durar mais ou menos
        entre 2 e 20 minutos: os mais curtos dependem de velocidade pura, que o
        modelo não descreve, e nos mais longos entram fadiga e alimentação.
      </p>

      <h2>Exemplo de cálculo</h2>
      <p>
        Um corredor tem quatro marcas recentes: 1.000 m em 3:10 (190 s), 2.000 m
        em 6:55 (415 s), 3.000 m em 10:30 (630 s) e 5.000 m em 18:00 (1.080 s).
      </p>
      <ul>
        <li>
          O ajuste distância-tempo dá uma inclinação de 4,50 m/s: a velocidade
          crítica é 16,2 km/h, ou 3:42/km.
        </li>
        <li>O intercepto dá D′ ≈ 145 m.</li>
        <li>
          Com quatro pontos, o intervalo de 95 % da inclinação é de ±0,11 m/s: a
          velocidade crítica fica entre 3:37 e 3:48/km.
        </li>
        <li>
          A 3:20/km (5,0 m/s), o D′ acaba depois de 145 / (5,0 − 4,50) ≈ 290 s,
          cerca de 1.450 m. O modelo prevê 1.500 m em uns 5:01.
        </li>
      </ul>
      <p>
        O pace de 5 km (3:36/km) é mais rápido que a velocidade crítica. É o
        esperado: qualquer prova curta o bastante para terminar antes de o D′
        zerar é corrida acima dela.
      </p>

      <h2>Como usar no treino</h2>
      <p>
        A velocidade crítica divide seus ritmos em dois mundos. Abaixo dela, a
        fadiga chega devagar e o limite é principalmente tempo e energia. Acima,
        cada metro além da reta sai do D′, e quando o D′ acaba você desacelera,
        diga o que disser a sua motivação.
      </p>
      <ul>
        <li>
          Tiros acima da VC: 5 × 1.000 m a 3:30/km (4,76 m/s) para o corredor do
          exemplo. Cada tiro percorre 1.000 − 4,50 × 210 ≈ 55 m acima da
          velocidade crítica, cerca de 38 % do D′. As recuperações devolvem uma
          parte, não tudo, e por isso os últimos tiros pesam mais (Jones e
          Vanhatalo, 2017).
        </li>
        <li>
          Trabalho logo abaixo da VC: 3 × 10' entre 3:48 e 3:52/km. É forte, mas
          o estado estável se mantém.
        </li>
        <li>
          Estratégia de prova: sair num 5 km mais rápido que a VC gasta o D′
          cedo demais. Distribua o D′ ao longo da distância e você termina mais
          rápido.
        </li>
      </ul>
      <p>
        Smyth e Muniz-Pumares (2020) mostraram que a velocidade crítica pode ser
        estimada a partir dos dados brutos de treino de maratonistas amadores,
        sem testes específicos, e que ela se relaciona com o tempo deles na
        maratona. As estatísticas do OpenAthlete fazem o mesmo na visão
        Capacidades: ajustam a reta aos seus melhores esforços entre 2 e 20
        minutos (pelo menos três), mostram o intervalo de 95 % e calculam da
        mesma forma a potência crítica no ciclismo. A{' '}
        <Link href="/pt-br/features">página de recursos</Link> resume o que mais
        é calculado a partir do seu histórico.
      </p>

      <h2>Limitações</h2>
      <p>
        Melhores marcas de treino não são testes máximos. Se seu melhor 3.000 m
        veio de um treino de limiar, a velocidade ajustada fica abaixo da real:
        o resultado vale no máximo o que seus esforços mostram. Esforços de
        durações muito parecidas dão um intervalo largo, e uma marca de GPS
        feita em descida ou com vento a favor puxa a reta para cima. O modelo
        também não diz nada sobre provas longas. A velocidade crítica não se
        sustenta por horas, e uma maratona é corrida bem abaixo dela, numa
        fração que depende mais de resistência e alimentação do que da reta.
        Para essas distâncias, combine-a com ferramentas baseadas nas suas
        provas, como o{' '}
        <Link href="/pt-br/tools/race-predictor">preditor de tempo</Link> ou as{' '}
        <Link href="/pt-br/pace-charts">tabelas de pace</Link>, e deixe a{' '}
        <Link href="/pt-br/learn/vma">VAM</Link> para a ponta curta da curva.
      </p>
    </div>
  );
}
