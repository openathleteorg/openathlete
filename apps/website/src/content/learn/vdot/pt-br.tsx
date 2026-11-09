import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        O VDOT é o número central do sistema de treino de Jack Daniels. O nome
        vem de “V-dot-O2max”, o jeito como os fisiologistas escrevem o VO2máx,
        mas ele não é medido em laboratório. Daniels e o matemático Jimmy
        Gilbert chegaram a ele de trás para frente, a partir de resultados de
        provas, nos anos 1970: se você correu uma distância em certa velocidade,
        que VO2máx explicaria isso com uma economia de corrida média? A resposta
        é um índice único que mostra o seu nível atual, prevê seus tempos em
        outras distâncias e dá os seus paces de treino.
      </p>
      <p>
        Como vem de um desempenho real, o VDOT já inclui o que um VO2máx de
        laboratório deixa de fora: o quanto a sua passada é econômica e qual
        fração do máximo você consegue sustentar durante uma prova inteira.
        Esses três fatores juntos explicam a maior parte do desempenho de
        endurance (Joyner e Coyle, 2008). Por isso dois corredores com o mesmo{' '}
        <Link href="/pt-br/learn/vo2max">VO2máx</Link> podem ter VDOTs separados
        por vários pontos, e por isso o VDOT prevê tempos melhor que o VO2máx.
      </p>

      <h2>Como o VDOT é calculado</h2>
      <p>
        As fórmulas de Daniels e Gilbert têm duas partes. A primeira dá o custo
        de oxigênio de correr a uma velocidade v, em metros por minuto. A
        segunda dá a fração do VO2máx que um corredor consegue sustentar numa
        prova de t minutos: perto de 100% por uns 10 minutos, em torno de 90%
        por 45 minutos e menos de 85% numa maratona.
      </p>
      <Formula
        where={[
          'Custo de oxigênio (ml/kg/min) = −4,6 + 0,182258 × v + 0,000104 × v²',
          'Fração sustentável = 0,8 + 0,1894393 × e^(−0,012778 × t) + 0,2989558 × e^(−0,1932605 × t)',
          'v = distância (m) / tempo (min); t = duração da prova em minutos',
        ]}
      >
        VDOT = custo de oxigênio / fração sustentável
      </Formula>
      <p>
        As fórmulas valem dos 1.500 m à maratona. Abaixo disso, a capacidade
        anaeróbia pesa demais; acima, hidratação, alimentação e calor decidem
        mais que o condicionamento aeróbio.
      </p>

      <h2>Um exemplo com contas</h2>
      <p>Uma corredora termina 10 km planos em 45:00.</p>
      <ul>
        <li>Velocidade: 10.000 m / 45 min = 222,2 m/min</li>
        <li>
          Custo de oxigênio: −4,6 + 0,182258 × 222,2 + 0,000104 × 222,2² = 41,0
          ml/kg/min
        </li>
        <li>
          Fração sustentável para 45 minutos: 0,8 + 0,1894 × e^(−0,575) + 0,2990
          × e^(−8,70) = 0,907
        </li>
        <li>VDOT = 41,0 / 0,907 = 45,3</li>
      </ul>
      <p>
        Fazendo a conta ao contrário, o mesmo VDOT prevê cerca de 21:42 nos 5
        km, 1:39:44 na meia maratona e 3:27:15 na maratona.
      </p>
      <p>
        Os paces de treino saem de frações fixas do VDOT, convertidas de volta
        em velocidade com a fórmula do custo de oxigênio. Para um VDOT de 45,3:
      </p>
      <ul>
        <li>Leve (59 a 74%): de 6:21 a 5:18 por km</li>
        <li>Maratona (a velocidade de maratona prevista): 4:55 por km</li>
        <li>Limiar (88%): 4:37 por km</li>
        <li>Intervalado (97,5%): 4:15 por km</li>
        <li>Repetições (105%): 4:00 por km, ou 96 segundos a cada 400 m</li>
      </ul>

      <h2>Como usar no treino</h2>
      <p>
        Cada pace tem uma função. O pace de limiar serve para tempo runs de 20
        minutos ou tiros longos como 5 × 1 km com um minuto de trote. O
        intervalado serve para tiros de três a cinco minutos, por exemplo 5 ×
        1.000 m com recuperação igual ao tiro, perto do treino na{' '}
        <Link href="/pt-br/learn/vma">VAM</Link>. O de repetições serve para
        tiros curtos e rápidos de 200 ou 400 m com recuperação completa,
        voltados à economia de corrida. O pace leve cobre quase toda a semana.
      </p>
      <p>
        Dois hábitos mantêm o sistema honesto. Defina o seu VDOT por uma prova
        recente, não pela que você espera correr: treinar no pace-alvo antes de
        ter o nível é o jeito clássico de se afundar. E suba aos poucos, um
        ponto depois de uma boa prova ou de um bloco de treinos bem controlados,
        em vez de correr atrás de cada dia bom.
      </p>
      <p>
        Na OpenAthlete, a página de recordes calcula o seu VDOT pelo seu melhor
        esforço entre 1.500 m e a maratona e mostra os paces de treino
        correspondentes. Neste site, as{' '}
        <Link href="/pt-br/pace-charts">tabelas de pace</Link> usam as mesmas
        fórmulas, e o{' '}
        <Link href="/pt-br/tools/race-predictor">
          previsor de tempo de prova
        </Link>{' '}
        dá uma segunda opinião com a fórmula de Riegel.
      </p>

      <h2>Limites</h2>
      <p>
        O VDOT supõe que a sua resistência acompanha a sua velocidade. Um
        corredor rápido nos 10 km mas com pouca quilometragem costuma ficar
        longe da maratona prevista, muitas vezes por vários minutos, porque as
        tabelas pressupõem um treino adequado à distância. Subidas, calor, vento
        e uma prova mal dosada derrubam o índice, então um VDOT de um dia ruim
        subestima você. A fração sustentável é uma curva média: alguns
        corredores sustentam uma parte maior do máximo que outros, e trail e
        ultra ficam fora do que as fórmulas foram feitas para cobrir. Use o VDOT
        como um ponto de partida bem calibrado e ajuste os paces pela sensação e
        pela frequência cardíaca.
      </p>
    </div>
  );
}
