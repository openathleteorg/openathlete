import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Fazer split negativo é correr a segunda metade de uma prova mais rápido
        que a primeira. O contrário, o split positivo, é o que quase todo mundo
        faz sem querer: uma largada embalada pela adrenalina e pela torcida, e
        depois uma longa quebra. Treinadores recomendam o split negativo há
        décadas, principalmente como remédio para essa quebra. As evidências são
        mais fracas do que o conselho dá a entender, mas o hábito que ele cria,
        se segurar no começo, vale para qualquer prova a partir dos 10 km.
      </p>

      <h2>Como se mede</h2>
      <p>
        Divida a prova em duas metades de mesma distância e compare os tempos.
        Expressar a diferença como porcentagem da primeira metade permite
        comparar um 10 km com uma maratona:
      </p>
      <Formula
        where={[
          'T1 = tempo da primeira metade, T2 = tempo da segunda',
          'Valor negativo: split negativo. Valor positivo: split positivo. Entre −1 e +1% mais ou menos: ritmo constante',
        ]}
      >
        split (%) = (T2 − T1) / T1 × 100
      </Formula>
      <p>
        A faixa de ±1% para chamar de ritmo constante é uma convenção prática,
        não uma regra: o desvio do GPS, o vento ou uma única subida já mudam uma
        metade nessa proporção. Em percurso com altimetria ou de ponto a ponto,
        compare metades de perfil parecido, ou olhe o{' '}
        <Link href="/pt-br/learn/grade-adjusted-pace">
          pace ajustado pela inclinação
        </Link>{' '}
        em vez do relógio.
      </p>

      <h2>Um exemplo com números</h2>
      <p>
        Uma corredora quer fazer 50:00 nos 10 km, ou seja, pace médio de
        5:00/km. Ela passa o km 5 em 25:30 (5:06/km) e corre os outros 5 km em
        24:30 (4:54/km).
      </p>
      <ul>
        <li>T2 − T1 = 1.470 − 1.530 = −60 s</li>
        <li>split = −60 / 1.530 × 100 = −3,9%</li>
      </ul>
      <p>
        É um split negativo claro, talvez claro demais: tirar um minuto na
        segunda metade de um 10 km costuma indicar que a largada foi
        conservadora e que ficou tempo na pista.
      </p>
      <p>
        Na maratona as margens são menores. Para 3h30 (4:59/km de média), um
        plano sensato é passar a meia em 1:45:50 (5:01/km) e correr a segunda
        metade em 1:44:10 (4:56/km): um split de −1,6%. Correr a primeira metade
        só dois ou três segundos por km mais devagar que a média custa 50
        segundos na passagem e dá folga para os últimos 10 km, onde a maioria
        das maratonas se perde.
      </p>

      <h2>Como usar</h2>
      <p>
        A ideia não é dar um sprint no final, e sim não pagar os juros de uma
        largada rápida demais. Os primeiros quilômetros acima do seu pace
        sustentável gastam glicogênio e tolerância à fadiga que você não
        recupera depois. Algumas regras práticas:
      </p>
      <ul>
        <li>
          Defina o pace-alvo a partir de uma prova recente, não de uma
          esperança. O{' '}
          <Link href="/pt-br/tools/race-predictor">previsor de tempo</Link> e as{' '}
          <Link href="/pt-br/pace-charts">tabelas de pace</Link> mostram as
          parciais por km para um tempo final.
        </li>
        <li>
          Na meia ou na maratona, corra os primeiros 3 a 5 km de 5 a 10 segundos
          por km mais devagar que o pace-alvo e depois se acomode. No 10 km, o
          quilômetro a segurar é o primeiro.
        </li>
        <li>
          Treine isso. Uma rodagem progressiva, por exemplo 12 km começando leve
          e terminando os últimos 3 em pace de maratona, ensina como é se
          segurar. Um longão de 26 km com os últimos 8 em pace de maratona faz o
          mesmo com mais cansaço nas pernas.
        </li>
        <li>
          Avalie a prova depois pelo split. Um split positivo acima de 3 ou 4%
          na maratona quase sempre aponta para a primeira metade, não para a
          segunda.
        </li>
      </ul>

      <h2>Limites</h2>
      <p>
        A ciência não transforma o split negativo em lei. Na revisão sobre
        estratégias de ritmo de Abbiss e Laursen (2008), um ritmo distribuído de
        forma uniforme tende a funcionar melhor em provas de mais de alguns
        minutos, e em provas muito longas atletas treinados costumam desacelerar
        aos poucos, seja qual for o plano. Díaz e colegas (2018) analisaram
        todos os recordes mundiais da maratona dos últimos cinquenta anos: em
        média, os recordistas correram a primeira metade um pouco mais rápido
        que a segunda. Os recordes mais recentes foram os mais regulares, e os
        autores sugerem que o caminho é um ritmo quase constante, mais do que um
        split negativo marcado.
      </p>
      <p>
        Então o objetivo honesto para a maioria é um ritmo constante com leve
        tendência negativa, não um final espetacular. O percurso também pesa:
        uma prova que sobe na segunda metade vai mostrar split positivo no
        relógio mesmo com esforço perfeitamente constante. No trail e nas
        ultras, onde terreno e noite pesam na segunda metade, comparar metades
        pelo tempo diz pouco; esforço percebido, frequência cardíaca e
        alimentação importam mais.
      </p>
    </div>
  );
}
