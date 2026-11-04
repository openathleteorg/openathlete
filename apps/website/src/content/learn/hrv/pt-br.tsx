import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        O coração não bate como um metrônomo. A 50 batimentos por minuto, o
        intervalo médio entre dois batimentos é de 1,2 segundo, mas um pode
        durar 1.150 ms e o seguinte 1.240 ms. A variabilidade da frequência
        cardíaca (VFC, ou HRV em inglês) mede essa variação. A maior parte da
        variação rápida, batimento a batimento, vem do nervo vago, o “freio”
        parassimpático do coração. Por isso a VFC é uma janela, estreita e cheia
        de ruído, para ver como o seu sistema nervoso autônomo está lidando com
        treino, sono, doença e estresse.
      </p>

      <h2>Como a VFC é calculada</h2>
      <p>
        Existem dezenas de índices de VFC (o documento da Task Force de 1996
        lista quase todos). Atletas e relógios usam principalmente o rMSSD, a
        raiz quadrada da média dos quadrados das diferenças sucessivas entre
        intervalos RR:
      </p>
      <Formula
        where={[
          'RRi = tempo entre dois batimentos consecutivos, em milissegundos',
          'N = número de intervalos da gravação',
        ]}
      >
        rMSSD = √( Σ (RRi+1 − RRi)² / (N − 1) )
      </Formula>
      <p>
        O rMSSD reflete bem a atividade vagal e funciona em gravações curtas:
        alguns minutos deitado ao acordar, ou as fases de sono profundo que o
        relógio escolhe durante a noite. Como os valores diários são
        assimétricos (algumas noites muito altas puxam a média para cima), os
        estudos sobre treino costumam usar o logaritmo natural, ln rMSSD, antes
        de tirar médias.
      </p>

      <h2>Um exemplo com números</h2>
      <p>
        Pegue cinco intervalos RR consecutivos: 1.000, 1.050, 980, 1.020 e 990
        ms.
      </p>
      <ul>
        <li>Diferenças sucessivas: +50, −70, +40, −30 ms</li>
        <li>Quadrados: 2.500 + 4.900 + 1.600 + 900 = 9.900</li>
        <li>Média sobre as 4 diferenças: 9.900 / 4 = 2.475</li>
        <li>rMSSD = √2.475 = 49,7 ms, ou seja, ln rMSSD = 3,91</li>
      </ul>
      <p>
        Uma gravação real tem centenas de intervalos, mas a conta é a mesma.
        Agora uma semana de leituras noturnas: 62, 58, 65, 48, 60, 63 e 59 ms. A
        média dos logaritmos é 4,08, que volta a ser 59 ms. A noite de 48 ms,
        depois do longão de domingo, assusta sozinha e quase não mexe no número
        da semana. Se a semana seguinte marcar 52, 49, 55, 50, 47, 51 e 48 ms, o
        valor de 7 dias cai para 3,92 (50 ms). Aí é uma mudança que se mantém, e
        vale uma pergunta.
      </p>

      <h2>Como usar no treino</h2>
      <p>
        O número de uma única manhã diz pouco. Plews e colegas (2013) mostraram
        que, em atletas de endurance de elite, a média móvel de 7 dias do ln
        rMSSD, e o quanto ela oscila, acompanha a adaptação muito melhor do que
        leituras isoladas. Uma rotina prática:
      </p>
      <ul>
        <li>
          Meça sempre do mesmo jeito: à noite com o mesmo relógio, ou ao
          acordar, deitado, antes do café.
        </li>
        <li>
          Monte uma referência com pelo menos três ou quatro semanas de treino
          normal e defina a sua faixa habitual em torno dela.
        </li>
        <li>
          Leia a média de 7 dias em relação a essa faixa, junto com a frequência
          de repouso, o sono e as sensações nos treinos.
        </li>
      </ul>
      <p>
        Kiviniemi e colegas (2007) foram além: um grupo de homens moderadamente
        treinados só fazia os treinos fortes nos dias em que a VFC não tinha
        caído, e rodagem leve nos outros. Eles melhoraram a velocidade máxima de
        corrida mais do que um grupo com uma planilha fixa. A ideia é útil, mas
        é um estudo com grupos pequenos, não uma regra. Para a maioria dos
        atletas, a VFC serve sobretudo para olhar uma semana com mais cuidado:
        se a média de 7 dias está abaixo da sua faixa há uma semana, a
        frequência de repouso subiu e os 5 × 4' no limiar pareceram uma prova,
        faça o dia leve.
      </p>
      <p>
        A OpenAthlete importa a VFC noturna de Garmin, Polar, Suunto e COROS
        (você também pode registrar à mão), mostra o valor da noite na linha de
        bem-estar de cada dia do calendário e traça a média móvel de 7 dias do
        ln rMSSD nas estatísticas de recuperação. Ela mostra a tendência; não a
        transforma em uma nota de prontidão.
      </p>

      <h2>Limites</h2>
      <p>
        Os valores absolutos são pessoais: entre pessoas saudáveis e treinadas
        vão de menos de 30 a mais de 100 ms, então se comparar com um parceiro
        de treino não faz sentido. Os aparelhos também diferem: alguns dão o
        rMSSD da noite inteira, outros o de uma janela de 5 minutos, outros uma
        nota própria; trocar de relógio zera a sua referência. Álcool, jantar
        tarde, calor, viagens e o ciclo menstrual mexem na VFC sem relação com o
        treino. E mais alto nem sempre é melhor: Buchheit (2014) lembra que, em
        atletas muito treinados, a VFC pode parar de subir ou até cair durante
        um bloco pesado enquanto eles se adaptam bem, e que uma alta brusca pode
        acompanhar uma fadiga profunda. A VFC é um sinal entre outros; leia
        junto com{' '}
        <Link href="/pt-br/learn/session-rpe">o quanto os treinos pesaram</Link>{' '}
        e com{' '}
        <Link href="/pt-br/learn/ctl-atl-tsb">as suas curvas de carga</Link>,
        nunca sozinha.
      </p>
    </div>
  );
}
