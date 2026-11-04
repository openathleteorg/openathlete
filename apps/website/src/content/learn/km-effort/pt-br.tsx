import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        O km-esforço é o jeito que os corredores de trail têm de transformar
        subida em distância: cada 100 m de ganho de elevação contam como um
        quilômetro a mais. Uma prova de 25 km com 1.000 m de D+ vira 35
        km-esforço, e dá para compará-la com um longão de 35 km no asfalto, ou
        com outro trail do mesmo total, de forma mais honesta do que olhando só
        a distância.
      </p>
      <p>
        É uma convenção, não uma lei da fisiologia. Ela nasceu no trail francês
        (<em>kilomètre-effort</em>), onde treinadores e organizadores precisavam
        de um jeito rápido de dizer quão duro era um percurso, e a ITRA usa a
        mesma soma, distância mais D+ dividido por 100, para classificar provas.
        A graça é que dá para fazer a conta de cabeça na largada.
      </p>

      <h2>Como o km-esforço é calculado</h2>
      <Formula
        where={[
          'km = distância do percurso ou do treino',
          'D+ = ganho de elevação total em metros',
        ]}
      >
        km-esforço = km + D+ / 100
      </Formula>
      <p>
        As descidas são ignoradas: não somam nem tiram. Alguns treinadores dão
        outro peso à subida em percursos muito íngremes ou muito corríveis, e
        outros somam parte do D−, mas 100 m por quilômetro é a versão mais comum
        e a usada aqui.
      </p>
      <p>
        Com o km-esforço, uma prova passada vira uma previsão. O{' '}
        <Link href="/pt-br/tools/trail-time-estimator">
          estimador de tempo de trail
        </Link>{' '}
        aplica a fórmula de resistência de Peter Riegel ao km-esforço em vez da
        distância:
      </p>
      <Formula
        where={[
          'T_ref, E_ref = tempo e km-esforço de uma prova que você já correu',
          'E = km-esforço da prova-alvo',
          'k = 1,06 (valor de Riegel no asfalto) para o limite baixo, 1,10 para o alto',
        ]}
      >
        T = T_ref × (E / E_ref)^k
      </Formula>

      <h2>Exemplo de cálculo</h2>
      <ul>
        <li>
          Referência: um trail de 25 km com 1.000 m de D+, ou seja, 25 + 1.000 /
          100 = 35 km-esforço, completado em 3:00:00. Isso dá 10.800 s / 35 =
          5:09 por km-esforço.
        </li>
        <li>
          Alvo: 42 km com 2.000 m de D+, ou seja, 42 + 20 = 62 km-esforço.
        </li>
        <li>Limite baixo: 3:00:00 × (62 / 35)^1,06 = 5 h 30.</li>
        <li>Limite alto: 3:00:00 × (62 / 35)^1,10 = 5 h 38.</li>
        <li>
          Então de 5 h 30 a 5 h 38, cerca de 5:20 por km-esforço e média de 7,5
          km/h nos 42 km reais.
        </li>
      </ul>
      <p>
        O expoente 1,06 vem do trabalho de Riegel com recordes de rua e de
        pista. O limite alto de 1,10 é uma suposição nossa para a queda extra de
        ritmo nos dias longos de trail, não um valor publicado; por isso você
        recebe uma faixa, e não um tempo cravado no minuto.
      </p>

      <h2>Como usar no treino</h2>
      <p>
        Conte a semana em km-esforço além de quilômetros. Doze quilômetros com
        600 m de D+ são 18 km-esforço; uma semana de 55 km com 2.000 m de D+ dá
        75 km-esforço, o mesmo que 75 km no plano. Uma planilha que só conta
        quilômetros sobrecarrega você sem avisar.
      </p>
      <p>
        Escolha os longões pelo km-esforço. Se a prova-alvo tem 62 km-esforço,
        um longão de 30 a 35 km-esforço com uma proporção realista de subida
        ensina muito mais do que 30 km no plano. Mantenha o D+ por quilômetro
        perto do da prova: uns 30 m/km num percurso ondulado, 60 m/km ou mais
        num alpino.
      </p>
      <p>
        O pace por km-esforço dá uma ideia aproximada do condicionamento de um
        percurso para outro. Se ele cai ao longo de um bloco em terrenos
        parecidos, é um sinal melhor do que uma volta rápida isolada. As{' '}
        <Link href="/pt-br/training-plans/trail">
          planilhas de treino de trail
        </Link>{' '}
        são montadas em cima desse tipo de progressão, e para as subidas em si,
        o{' '}
        <Link href="/pt-br/learn/grade-adjusted-pace">
          pace ajustado à inclinação
        </Link>{' '}
        mostra quanto cada uma custou em energia.
      </p>

      <h2>Limites</h2>
      <p>
        Uma regra só para todas as inclinações é uma simplificação. Numa subida
        suave e corrível, 100 m de D+ custam menos que um quilômetro; num
        paredão de 25% subido caminhando com bastões, podem custar mais. O
        terreno pesa ainda mais: pedras, raízes, lama, neve e pedreiras atrasam
        muito além do que a altimetria diz, e duas provas com o mesmo km-esforço
        podem terminar muito longe uma da outra.
      </p>
      <p>
        Ignorar as descidas é o maior ponto cego. Num percurso com descidas
        longas e íngremes, na segunda metade quem manda são os quadríceps, não o
        fôlego, e o km-esforço não vê isso chegando. A noite, a altitude acima
        de uns 2.000 m, o calor e o tempo nos postos de abastecimento também
        ficam fora da fórmula. Uma referência de prova de rua supõe trilhas
        corríveis e leva a sua velocidade do asfalto para as subidas: em terreno
        técnico, conte com terminar depois da faixa.
      </p>
      <p>
        Por fim, o km-esforço não diz nada sobre o seu índice ITRA ou UTMB, que
        usam modelos próprios. Use-o como uma moeda comum para planejar, não
        como uma nota.
      </p>
    </div>
  );
}
