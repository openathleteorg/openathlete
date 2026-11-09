import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Seus músculos produzem lactato em qualquer ritmo, até caminhando, e o
        removem o tempo todo. Em ritmo leve as duas coisas se equilibram e a
        concentração no sangue fica perto da de repouso, em torno de 1 mmol/L.
        Acelere e, em algum momento, a produção passa a remoção. Esse ponto é o
        que se chama de limiar de lactato, e é ele que explica por que um pace
        que você segura por uma hora não tem nada a ver com outro apenas 15
        segundos por quilômetro mais rápido.
      </p>
      <p>
        O problema é que «o» limiar de lactato não existe como um número único.
        Faude, Kindermann e Meyer (2009) revisaram mais de vinte conceitos de
        limiar na literatura, com protocolos diferentes e regras diferentes para
        ler a mesma curva. Na prática, eles se dividem em duas famílias. O
        primeiro limiar (LT1, muitas vezes chamado de limiar aeróbio) é onde o
        lactato começa a subir acima do repouso. O segundo (LT2, limiar
        anaeróbio ou, na versão mais rigorosa, máximo estado estável de lactato)
        é a intensidade mais alta em que o lactato ainda se estabiliza em vez de
        subir até você parar. Quando um treinador fala em «treino de limiar»,
        quase sempre está falando do LT2.
      </p>

      <h2>Como é medido</h2>
      <p>
        O teste clássico é progressivo, na esteira ou na pista: estágios de 3 a
        5 minutos, cada um 0,5 a 1 km/h mais rápido que o anterior, com uma gota
        de sangue tirada do dedo ou do lóbulo da orelha no fim de cada estágio.
        Depois o limiar é lido na curva. Duas regras são comuns: uma
        concentração fixa, em geral 4 mmol/L para o LT2, e uma alta em relação
        ao valor basal, muitas vezes basal + 1 mmol/L para o LT1. A velocidade
        entre dois estágios sai por interpolação linear:
      </p>
      <Formula
        where={[
          'La = lactato-alvo (4 mmol/L, ou basal + 1)',
          'v1, La1 = velocidade e lactato do último estágio abaixo do alvo',
          'v2, La2 = velocidade e lactato do primeiro estágio acima',
        ]}
      >
        v = v1 + (La − La1) / (La2 − La1) × (v2 − v1)
      </Formula>
      <p>
        O máximo estado estável de lactato é a referência que os outros métodos
        tentam aproximar, mas são necessários vários dias de corridas de 30
        minutos em ritmo constante para encontrá-lo, por isso quase ninguém o
        mede fora do laboratório (Jones et al., 2019).
      </p>

      <h2>Exemplo de cálculo</h2>
      <p>
        Uma corredora faz estágios de 4 minutos a partir de 10 km/h,
        acrescentando 1 km/h a cada vez. Lactato no fim de cada estágio: 1,1;
        1,2; 1,4; 1,8; 2,6; 4,1 e 6,3 mmol/L a 10, 11, 12, 13, 14, 15 e 16 km/h.
      </p>
      <ul>
        <li>
          LT2 a 4 mmol/L: entre 14 km/h (2,6) e 15 km/h (4,1). v = 14 + (4 −
          2,6) / (4,1 − 2,6) × 1 = 14,9 km/h, ou 4:01/km.
        </li>
        <li>
          LT1 a basal + 1: o menor valor é 1,1, então o alvo é 2,1 mmol/L, entre
          13 km/h (1,8) e 14 km/h (2,6). v = 13 + 0,3 / 0,8 = 13,4 km/h, ou
          4:29/km.
        </li>
      </ul>
      <p>
        Mesmo teste, mesmo sangue, e os dois limiares ficam quase 30 segundos
        por quilômetro distantes. Com outra regra de leitura (o ponto mais
        distante da reta que liga o primeiro e o último estágio, por exemplo),
        sairia mais um valor diferente. Não é defeito do teste: é o motivo para
        sempre perguntar de qual limiar se está falando.
      </p>

      <h2>Como usar no treino</h2>
      <p>
        Sem laboratório, uma boa estimativa de campo do LT2 é o pace que você
        conseguiria sustentar em prova por cerca de uma hora, que para a maioria
        dos corredores treinados fica entre o pace de 10 km e o de meia
        maratona. As <Link href="/pt-br/pace-charts">tabelas de pace</Link> dão
        esse ritmo a partir de um tempo recente. A frequência cardíaca no LT2
        costuma ficar entre 85 e 92 % da máxima, mas a variação individual é
        grande.
      </p>
      <ul>
        <li>
          Treinos de limiar: 3 × 10' ou 5 × 6' no pace de LT2 com 1 a 2 minutos
          de trote, ou 20 a 30 minutos contínuos. Deve parecer «forte, mas
          controlado»: dá para falar algumas palavras, não uma frase.
        </li>
        <li>
          A rodagem leve fica abaixo do LT1. É esse teto que a{' '}
          <Link href="/pt-br/learn/zone-2">zona 2</Link> tenta representar, e
          numa semana{' '}
          <Link href="/pt-br/learn/polarized-training">polarizada</Link> a maior
          parte dos seus minutos fica ali.
        </li>
        <li>
          Repita o teste a cada 6 a 10 semanas, ou use suas provas: o limiar
          muda com o condicionamento, e zonas antigas acabam no lugar errado da
          planilha.
        </li>
      </ul>
      <p>
        O OpenAthlete não mede lactato. Você informa ou sincroniza suas zonas, e
        as estatísticas mostram como seu tempo se divide abaixo, entre e acima
        dos seus limiares ao longo das semanas, ao lado das curvas de{' '}
        <Link href="/pt-br/features/training-load">carga de treino</Link>.
      </p>

      <h2>Limitações</h2>
      <p>
        O número depende do protocolo: estágios mais curtos dão uma velocidade
        de limiar mais alta, porque o lactato ainda não terminou de subir na
        hora da coleta. Os lactímetros portáteis diferem entre si em alguns
        décimos de mmol/L, o que desloca bastante um limiar de valor fixo num
        trecho plano da curva. Com o glicogênio baixo, o lactato cai em todas as
        velocidades e o limiar parece melhor do que é. E uma velocidade medida
        na esteira a 18 °C não vale do mesmo jeito num percurso com subidas e
        calor. Se você prefere uma referência de ritmo tirada das suas próprias
        provas, e não de uma amostra de sangue, veja a{' '}
        <Link href="/pt-br/learn/critical-speed">velocidade crítica</Link>, que
        fica logo acima do máximo estado estável de lactato.
      </p>
    </div>
  );
}
