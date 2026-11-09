import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        O VO2máx é a taxa mais alta com que você consegue tirar oxigênio do ar e
        usá-lo nos músculos. É expresso em litros por minuto ou, mais útil para
        quem corre, em mililitros por quilo por minuto, já que um corpo mais
        pesado custa mais para carregar. A. V. Hill descreveu o platô do consumo
        de oxigênio nos anos 1920, e desde então o VO2máx é o número mais famoso
        da fisiologia do endurance. Ele mede o tamanho do seu motor aeróbio.
        Sozinho, não decide o quanto você corre rápido numa prova.
      </p>

      <h2>O que define o VO2máx: a equação de Fick</h2>
      <p>
        O consumo de oxigênio é o produto do sangue bombeado pelo coração pelo
        oxigênio que os músculos extraem dele:
      </p>
      <Formula
        where={[
          'Q = débito cardíaco (litros de sangue por minuto) = frequência cardíaca × volume sistólico',
          'CaO2 − CvO2 = diferença de conteúdo de oxigênio entre sangue arterial e venoso (ml de O2 por litro)',
        ]}
      >
        VO2 = Q × (CaO2 − CvO2)
      </Formula>
      <p>
        No esforço máximo, a extração varia menos entre treinados e sedentários
        do que o débito cardíaco, e a frequência cardíaca máxima não sobe com o
        treino. O que separa um 40 de um 70 é principalmente o volume sistólico,
        o sangue ejetado a cada batimento. Bassett e Howley (2000) concluem que,
        em atletas treinados, o VO2máx é limitado sobretudo pela oferta de
        oxigênio, mais do que pelos músculos.
      </p>

      <h2>Como medir ou estimar</h2>
      <p>
        A referência é o teste de laboratório (a ergoespirometria): corrida na
        esteira com velocidade crescente e uma máscara que analisa o ar
        expirado, até o consumo de oxigênio parar de subir mesmo com mais
        velocidade. Todo o resto é estimativa:
      </p>
      <ul>
        <li>
          O teste de Cooper (Cooper, 1968): distância corrida em 12 minutos, e
          VO2máx = (distância em metros − 504,9) / 44,73.
        </li>
        <li>
          A razão entre frequências (Uth et al., 2004): VO2máx ≈ 15,3 × FCmáx /
          FCrepouso. Rápido, mas exige uma FC máxima real e ignora o quanto você
          corre.
        </li>
        <li>
          O desempenho em prova: o <Link href="/pt-br/learn/vdot">VDOT</Link> de
          Daniels transforma um tempo de prova num VO2máx “efetivo”, que inclui
          a sua economia de corrida.
        </li>
        <li>
          Os relógios: Garmin, Polar, COROS e outros estimam pela relação entre
          frequência cardíaca e pace ou potência, com modelos que não publicam
          por completo.
        </li>
      </ul>

      <h2>Um exemplo com números</h2>
      <p>
        Um corredor faz 2.900 m no teste de Cooper, tem frequência de repouso de
        48 e máxima de 188, e acabou de correr 10 km em 45:00.
      </p>
      <ul>
        <li>Cooper: (2.900 − 504,9) / 44,73 = 53,5 ml/kg/min</li>
        <li>Razão entre frequências: 15,3 × 188 / 48 = 59,9 ml/kg/min</li>
        <li>VDOT dos 10 km: 45,3</li>
      </ul>
      <p>
        Três números entre 45 e 60 para a mesma pessoa. Nenhum está errado: eles
        medem coisas diferentes. A razão olha só para o coração, o Cooper para
        um esforço de 12 minutos, o VDOT para o que o corredor realmente produz
        em 45 minutos. Uma diferença assim costuma indicar um bom motor com
        espaço para melhorar economia e resistência.
      </p>
      <p>
        Para a versão de laboratório, com valores plausíveis: um débito cardíaco
        de 25 litros por minuto e uma extração de 160 ml de oxigênio por litro
        de sangue dão 4.000 ml/min, ou 57 ml/kg/min para um corredor de 70 kg.
      </p>

      <h2>VO2máx, VAM e economia de corrida</h2>
      <p>
        No plano, correr custa cerca de 3,5 ml/kg/min de oxigênio por km/h
        (Léger e Mercier, 1984). Dividindo o VO2máx por esse custo, você chega a
        uma <Link href="/pt-br/learn/vma">VAM</Link> aproximada: 53,5 / 3,5 ≈
        15,3 km/h, perto dos 15 km/h que esse corredor faz no teste de 6
        minutos. Quem gasta menos oxigênio por km/h, o mais econômico, corre
        mais rápido com o mesmo VO2máx. Joyner e Coyle (2008) descrevem o
        desempenho de endurance como três fatores juntos: o VO2máx, a fração
        dele que você sustenta (ligada ao limiar de lactato) e a economia.
      </p>

      <h2>Como usar no treino</h2>
      <p>
        O VO2máx responde a trabalho perto dele: de 4 a 6 tiros de 3 a 5 minutos
        a 95–100% da VAM, com recuperações de duração parecida, ou formatos
        curtos como o 30/30. Ele também sobe com volume de rodagem leve, graças
        a um volume sistólico maior. Para definir paces, VAM e VDOT são mais
        práticos, porque são velocidades. Na OpenAthlete, o VO2máx é uma métrica
        importada de Garmin, Polar ou COROS ou digitada à mão, que você
        acompanha na página de métricas ao lado da{' '}
        <Link href="/pt-br/learn/hrv">VFC</Link> e da frequência de repouso. A{' '}
        <Link href="/pt-br/tools/vma">calculadora de VAM</Link> dá os paces.
      </p>

      <h2>Limitações</h2>
      <p>
        Entre corredores de nível parecido, o VO2máx prevê mal os resultados:
        economia e fração sustentável pesam tanto quanto. Os valores do relógio
        mudam com calor, subidas, cansaço e uma frequência máxima errada, então
        leia como tendência ao longo de semanas. A genética define boa parte do
        teto e os ganhos diminuem depois dos primeiros anos, enquanto limiar e
        economia podem continuar evoluindo por muito tempo.
      </p>
    </div>
  );
}
