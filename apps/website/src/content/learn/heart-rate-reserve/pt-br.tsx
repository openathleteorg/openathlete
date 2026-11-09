import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        A frequência cardíaca de reserva é a faixa com que o seu coração
        realmente trabalha: a frequência máxima menos a frequência de repouso.
        Quem tem 50 em repouso e chega a 190 tem 140 batimentos de reserva.
        Montar as zonas sobre essa faixa, em vez de usar um simples percentual
        da máxima, é o chamado método de Karvonen, em referência ao fisiologista
        finlandês Martti Karvonen, que o usou em 1957 num estudo sobre como o
        treino baixava a frequência cardíaca.
      </p>
      <p>
        A vantagem é levar em conta o seu ponto de partida. Dois corredores com
        a mesma máxima mas repouso diferente não têm a mesma rodagem leve em
        batimentos por minuto, e a reserva enxerga isso. Ela também conversa
        melhor com a fisiologia: Swain e Leutholtz (1997) mostraram que um
        percentual da frequência cardíaca de reserva corresponde ao mesmo
        percentual da reserva de consumo de oxigênio, enquanto um percentual da
        frequência máxima não corresponde ao mesmo percentual do VO2max.
      </p>

      <h2>Como calcular</h2>
      <Formula
        where={[
          'FCR = FCmáx − FCrepouso, em batimentos por minuto',
          'intensidade = a fração da reserva desejada, 0,6 para 60%',
        ]}
      >
        FC alvo = FCrepouso + (FCmáx − FCrepouso) × intensidade
      </Formula>
      <p>
        As cinco zonas mais comuns são faixas de 10% da reserva: 50–60%, 60–70%,
        70–80%, 80–90% e 90–100%. São convenções, não limiares medidos em você,
        e isso faz diferença mais adiante.
      </p>

      <h2>Um exemplo com números</h2>
      <p>Repouso 50 bpm, máxima 190 bpm: 140 batimentos de reserva.</p>
      <ul>
        <li>Zona 1 (50–60%): 50 + 0,5 × 140 = de 120 a 134 bpm</li>
        <li>Zona 2 (60–70%): de 134 a 50 + 0,7 × 140 = 148 bpm</li>
        <li>Zona 3 (70–80%): de 148 a 162 bpm</li>
        <li>Zona 4 (80–90%): de 162 a 176 bpm</li>
        <li>Zona 5 (90–100%): de 176 a 190 bpm</li>
      </ul>
      <p>
        Com percentuais da máxima, a mesma zona 2 iria de 114 a 133 bpm, uns 15
        batimentos abaixo. Para quem está treinado, 114 bpm é quase caminhar, e
        é por isso que muita gente que passa para Karvonen percebe que a rodagem
        deixa de parecer passeio.
      </p>
      <p>
        Agora mantenha a máxima em 190 e suba o repouso para 65. A reserva cai
        para 125 batimentos e a zona 2 vira 65 + 0,6 × 125 = 140 até 65 + 0,7 ×
        125 = 152,5, ou seja, de 140 a 153 bpm, aproximadamente. Mesma máxima,
        outra zona, porque o ponto de partida mudou.
      </p>

      <h2>Medindo bem os dois valores</h2>
      <p>
        A frequência de repouso se mede deitado, ao acordar, antes do café,
        durante várias manhãs; fique com um valor típico, não com o mais baixo
        que já apareceu. Os relógios costumam mostrar o mínimo durante o sono,
        alguns batimentos abaixo, o que infla um pouco a reserva.
      </p>
      <p>
        A máxima é mais difícil. O maior valor que você já viu no fim de uma
        prova dura, ou depois do último de uma série de tiros em subida, vale
        mais que qualquer fórmula. Sem nada disso, Tanaka, Monahan e Seals
        (2001) propõem 208 − 0,7 × idade, ou seja, 180 bpm aos 40 anos. É uma
        média populacional: muita gente fica 10 batimentos ou mais acima ou
        abaixo, e uma máxima 10 batimentos alta demais empurra cada zona 6 a 9
        batimentos para cima.
      </p>

      <h2>Como usar no treino</h2>
      <p>
        As zonas de frequência cardíaca funcionam melhor em esforços longos e
        constantes, quando o coração tem tempo de estabilizar. Rodagens e
        longões em <Link href="/pt-br/learn/zone-2">zona 2</Link> são o caso
        mais claro: de 134 a 148 bpm para o corredor do exemplo, qualquer que
        seja o pace num dia de vento ou de subidas. Um tempo run de 30 a 40
        minutos em zona 3, ou 2 × 15 minutos no alto da zona 4 (por volta de 169
        a 173 bpm, 85–88% da reserva), também se controlam bem pelo coração.
      </p>
      <p>
        Em tiros curtos, como 5 × 4 minutos no limiar, a frequência cardíaca
        fica atrás do esforço: leva um ou dois minutos para subir, e o primeiro
        tiro parece fácil no relógio quando não é. Controle esses treinos pelo
        pace ou pela potência e use a frequência cardíaca depois, para conferir
        se o treino cumpriu o papel. A mesma fração da reserva também entra em
        cargas como o <Link href="/pt-br/learn/trimp">TRIMP</Link>, então
        acertar repouso e máxima rende duas vezes.
      </p>
      <p>
        A{' '}
        <Link href="/pt-br/tools/heart-rate-zones">
          calculadora de zonas de frequência cardíaca
        </Link>{' '}
        faz as contas pelos dois métodos. No OpenAthlete, as zonas de frequência
        cardíaca podem ser definidas em percentual da máxima ou da reserva, a
        reserva é calculada a partir das suas métricas de repouso e máxima, e os
        passos de um treino podem ter como alvo um percentual da frequência
        cardíaca de reserva.
      </p>

      <h2>Limites</h2>
      <p>
        Tudo depende de dois valores, e nenhum é fixo. A frequência de repouso
        varia alguns batimentos com o sono, o estresse, o calor ou um resfriado
        chegando; a frequência no esforço sobe com calor, desidratação, cafeína
        e altitude, e deriva para cima nos esforços longos. Alguns remédios, os
        betabloqueadores em especial, mudam as duas pontas.
      </p>
      <p>
        O limite maior é que 60, 70 ou 80% da reserva são iguais para todo
        mundo, e a fisiologia não. O{' '}
        <Link href="/pt-br/learn/lactate-threshold">limiar de lactato</Link> de
        um corredor fica em 82% da reserva, o de outro em 90%. Se você conhece a
        sua frequência no limiar, por um teste de laboratório ou um esforço de
        30 minutos em prova, ancorar as zonas nela é mais preciso. Karvonen é um
        bom ponto de partida quando você não conhece.
      </p>
    </div>
  );
}
