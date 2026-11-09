import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        O pace ajustado à inclinação, ou GAP (<em>grade-adjusted pace</em>),
        converte o que você correu numa subida ou descida no pace que teria
        custado a mesma energia no plano. Um quilômetro a 7:30 numa rua com 8%
        de inclinação parece lento no relógio; corrigido pela inclinação, vale
        pouco menos de 5:00 no plano. O GAP existe porque o pace bruto deixa de
        dizer muita coisa assim que o terreno inclina, e no trail isso acontece
        quase o tempo todo.
      </p>
      <p>
        Há vários modelos. O usado aqui, e no OpenAthlete, vem de Alberto
        Minetti e colegas, que mediram o consumo de oxigênio de corredores numa
        esteira inclinada entre −45% e +45% e ajustaram uma curva aos resultados
        (Minetti et al., 2002).
      </p>

      <h2>Como o pace ajustado à inclinação é calculado</h2>
      <p>
        A curva de Minetti dá o custo energético de correr um metro conforme a
        inclinação, por quilo de massa corporal. No plano, ele vale 3,6 J/kg/m.
        O GAP aplica ao seu pace a razão entre o custo no plano e o custo na
        inclinação:
      </p>
      <Formula
        where={[
          'C(i) = 155,4i⁵ − 30,4i⁴ − 43,3i³ + 46,3i² + 19,5i + 3,6, em J/kg/m',
          'i = inclinação em fração: 0,08 para 8%, −0,10 para −10%',
          'C(0) = 3,6 no plano',
        ]}
      >
        GAP = pace na inclinação × 3,6 / C(i)
      </Formula>
      <p>
        A mesma razão funciona ao contrário: o pace a manter numa subida para um
        esforço dado no plano é <code>pace no plano × C(i) / 3,6</code>. Numa
        atividade inteira, o cálculo é feito ponto a ponto a partir da altitude
        registrada e depois tirada a média, então um treino com subidas mostra
        um GAP ao lado do pace médio bruto.
      </p>

      <h2>Exemplo de cálculo</h2>
      <ul>
        <li>
          Subida: 7:30/km numa inclinação de 8%. C(0,08) = 5,43, ou seja, 1,51
          vez o custo no plano. 7:30 (450 s) / 1,51 = 298 s, cerca de 4:58/km no
          plano.
        </li>
        <li>
          Ao contrário: quem faz a rodagem leve no plano a 5:30/km quer manter o
          mesmo esforço numa subida de 6%. C(0,06) = 4,93, 1,37 vez o custo no
          plano, então 5:30 × 1,37 = 7:32/km. A 15%, a razão sobe para 2,06 e o
          pace para 11:20/km: aí quase todo mundo caminha, e faz bem.
        </li>
        <li>
          Descida: 4:30/km a −10%. C(−0,10) = 2,15, só 0,6 vez o custo no plano,
          então o equivalente no plano é 7:32/km. A conta de energia é pequena;
          a dos quadríceps, nem tanto.
        </li>
      </ul>
      <p>
        A{' '}
        <Link href="/pt-br/tools/grade-adjusted-pace">
          calculadora de pace ajustado à inclinação
        </Link>{' '}
        faz essas contas para qualquer pace e inclinação.
      </p>

      <h2>Como usar no treino</h2>
      <p>
        O GAP serve principalmente para comparar treinos em terrenos diferentes.
        Uma volta de 14 km com 500 m de ganho de elevação a 6:10/km de média e
        14 km no plano a 5:20/km podem ter sido o mesmo treino para o seu
        coração. Olhar o GAP junto com a frequência cardíaca diz se um dia lento
        foi culpa das subidas ou sua.
      </p>
      <p>
        Ele também ajuda a definir referências em percursos com subidas. Se a
        sua rodagem deve ficar num esforço de 5:30 no plano, uma subida de 6% a
        7:30 está ok; a mesma subida a 6:30 é um tempo run disfarçado. Em tiros
        de subida como 8 × 2', o GAP permite conferir se o último valeu o mesmo
        que o primeiro, mesmo que o pace no relógio tenha mudado.
      </p>
      <p>
        No dia da prova, cuidado. O GAP diz quanto uma subida custa em energia,
        não quanto tempo vai durar uma prova de montanha; para isso, o{' '}
        <Link href="/pt-br/learn/km-effort">km-esforço</Link> e o{' '}
        <Link href="/pt-br/tools/trail-time-estimator">
          estimador de tempo de trail
        </Link>{' '}
        respondem melhor à pergunta.
      </p>
      <p>
        O OpenAthlete aplica a curva de Minetti a cada corrida e trail que você
        sincroniza. A inclinação é lida da altitude em janelas de 10 m e
        limitada a ±30%, porque leituras mais íngremes costumam ser ruído do GPS
        ou do barômetro, não terreno.
      </p>

      <h2>Limites</h2>
      <p>
        Os voluntários de Minetti corriam numa esteira lisa. Pedras, raízes,
        lama e zigue-zagues acrescentam um custo que a curva não conhece: em
        terreno técnico, o seu esforço real foi maior do que o GAP mostra.
      </p>
      <p>
        As descidas são o ponto fraco. No papel, o custo continua caindo até um
        mínimo por volta de −18 a −20%, onde um metro custa metade do que no
        plano. Na prática, a partir de uns −10%, o que limita é a frenagem, a
        pisada e a carga excêntrica nos quadríceps, muito antes da energia. Uma
        descida rápida mostra um GAP tranquilo, mas costuma ser ela que deixa
        você dolorido por três dias.
      </p>
      <p>
        Os dados de altitude têm ruído. Um relógio com barômetro se sai melhor
        que a altitude do GPS, mas os dois criam pequenas subidas falsas no
        plano que deslocam o GAP. Rampas curtas e íngremes, como um muro de 20
        m, são suavizadas pela janela de cálculo.
      </p>
      <p>
        Por fim, outras plataformas usam outros modelos. O Strava diz ter
        construído o seu GAP a partir de dados de frequência cardíaca dos
        usuários, e não de medições de laboratório, e dá menos crédito às
        descidas. Os números mudam de uma ferramenta para outra: compare os seus
        treinos dentro da mesma ferramenta, não entre duas.
      </p>
    </div>
  );
}
