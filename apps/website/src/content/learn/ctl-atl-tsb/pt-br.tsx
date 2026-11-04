import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        CTL, ATL e TSB são três curvas tiradas da mesma carga de treino diária.
        A CTL (<em>chronic training load</em>) costuma ser chamada de
        condicionamento, a ATL (<em>acute training load</em>) de fadiga e a TSB
        (<em>training stress balance</em>) de forma. Elas vêm do modelo de
        impulso-resposta que Eric Banister publicou em 1975: cada sessão aumenta
        ao mesmo tempo o seu condicionamento e a sua fadiga, a fadiga some em
        poucos dias, o condicionamento em semanas, e o desempenho está na
        diferença entre os dois. As siglas foram popularizadas depois pelos
        softwares de ciclismo, mas a matemática é de Banister.
      </p>

      <h2>Como são calculadas</h2>
      <p>
        O ponto de partida é uma carga por dia, por exemplo a soma do{' '}
        <Link href="/pt-br/learn/trimp">TRIMP</Link> das sessões do dia (0 no
        dia de descanso). Condicionamento e fadiga são médias com peso
        exponencial dessa série, com constantes de tempo diferentes:
      </p>
      <Formula
        where={[
          'CTL: τ = 42 dias, cada dia pesa 1 − e^(−1/42) ≈ 0,0235',
          'ATL: τ = 7 dias, cada dia pesa 1 − e^(−1/7) ≈ 0,133',
          'TSB = CTL − ATL',
        ]}
      >
        hoje = ontem + (1 − e^(−1/τ)) × (carga − ontem)
      </Formula>
      <p>
        Com τ = 42 dias, o efeito de uma sessão sobre a CTL cai pela metade em
        cerca de 29 dias; sobre a ATL, em menos de 5. Algumas ferramentas usam o
        atalho das médias móveis, 2 / (N + 1), como peso diário. Não é o mesmo
        modelo: com N = 42 dá 0,047, o dobro de 0,0235, o que equivale a cortar
        pela metade as duas constantes de tempo e deixa as curvas muito mais
        reativas (Clarke e Skiba, 2013, mostram a dedução).
      </p>
      <p>
        As ferramentas também divergem sobre o dia usado na TSB. A OpenAthlete
        subtrai os valores do mesmo dia, já com a carga do dia contada; outras
        usam os de ontem, para descrever o quanto você está descansado ao
        começar o treino de hoje. Com os mesmos dados a diferença pode ser de
        alguns pontos, então não compare números entre aplicativos.
      </p>

      <h2>Um exemplo com contas</h2>
      <p>
        Uma corredora mantém há meses uma média de 60 de TRIMP por dia: CTL e
        ATL estão em 60, a TSB em 0. Ela começa uma semana pesada, com 90 por
        dia. Depois do primeiro dia:
      </p>
      <ul>
        <li>CTL = 60 + 0,0235 × (90 − 60) = 60,7</li>
        <li>ATL = 60 + 0,133 × (90 − 60) = 64,0</li>
        <li>TSB = 60,7 − 64,0 = −3,3</li>
      </ul>
      <p>
        Depois de sete dias a 90, a CTL mal subiu, para 64,6, enquanto a ATL
        pulou para 79,0: a TSB está em −14,4. Ela está um pouco mais
        condicionada e claramente cansada. Em seguida desce para 40 por dia
        durante uma semana. A ATL cai rápido para 54,3, a CTL só recua para 60,8
        e a TSB volta ao positivo, +6,5. Essa assimetria, a fadiga indo embora
        antes do condicionamento, é todo o princípio do{' '}
        <Link href="/pt-br/learn/taper">polimento</Link>.
      </p>

      <h2>Como usar no treino</h2>
      <p>
        A CTL diz quanto treino você absorveu no último mês ou dois. Uma subida
        constante de alguns pontos por semana durante um bloco de construção é o
        quadro comum; um salto brusco merece uma pergunta, e um platô longo
        também, se você esperava evoluir. A ATL muda toda semana e explica
        principalmente por que as pernas estão pesadas. A TSB é a que se olha
        antes de uma prova: a maioria dos atletas corre bem entre um valor
        levemente negativo e um claramente positivo, mas o valor certo é
        pessoal, e só se descobre anotando a TSB antes das provas que deram
        certo e das que deram errado.
      </p>
      <p>
        As curvas ficam mais úteis quando se estendem para o futuro. Se as
        sessões planejadas têm uma estimativa de carga, o modelo pode projetar
        CTL, ATL e TSB até o dia da prova e mostrar se as duas últimas semanas
        deixam você realmente descansado na largada. A OpenAthlete faz isso:
        calcula as curvas a partir das suas atividades e as projeta sobre as
        sessões do seu calendário. Ela sinaliza uma TSB abaixo de −20 ou acima
        de +25; esses limites são convenções para ler a curva, não valores
        validados. Na{' '}
        <Link href="/pt-br/features/training-load">
          página de carga de treino
        </Link>{' '}
        estão os detalhes e o código.
      </p>

      <h2>Limites</h2>
      <p>
        O modelo só é tão bom quanto a carga diária que recebe. O TRIMP por
        frequência cardíaca subestima tiros curtos, musculação e descidas, então
        as curvas perdem parte do que um corredor de trilha ou um triatleta faz
        na academia. Buracos nos dados também atrapalham: uma semana de rodagens
        sem cinta cardíaca parece uma semana de folga.
      </p>
      <p>
        As constantes de tempo são convenções. Banister as ajustava atleta por
        atleta, e os valores variam muito; 42 e 7 dias são padrões razoáveis,
        não a sua fisiologia. Hellard e colegas (2006) mostraram como os
        parâmetros ajustados são instáveis mesmo com bons dados de nadadores de
        elite. E o modelo não sabe nada de sono, doença ou estresse fora do
        esporte. Uma TSB negativa não diagnostica overtraining, e uma alta não
        garante que você está pronto. Leia as curvas junto com a{' '}
        <Link href="/pt-br/learn/session-rpe">PSE da sessão</Link>, a{' '}
        <Link href="/pt-br/learn/hrv">VFC</Link> e as suas sensações.
      </p>
    </div>
  );
}
