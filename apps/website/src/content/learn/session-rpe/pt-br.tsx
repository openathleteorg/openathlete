import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        A PSE da sessão (percepção subjetiva de esforço, o RPE em inglês) é a
        medida de carga mais simples que se sustenta na pesquisa: você dá uma
        nota de 0 a 10 para o quanto a sessão inteira foi dura, multiplica pela
        duração em minutos e tem uma carga em unidades arbitrárias. Carl Foster
        e colegas a descreveram no fim dos anos 1990 e a compararam com os
        métodos por frequência cardíaca em 2001. Não precisa de sensor nenhum,
        funciona em qualquer esporte, inclusive musculação e treinos técnicos, e
        capta o que a frequência cardíaca não vê, como as coxas moídas por uma
        descida ou o custo mental de uma prova.
      </p>

      <h2>Como se calcula a PSE da sessão</h2>
      <Formula
        where={[
          'PSE: esforço percebido na sessão inteira, na escala CR-10 de 0 a 10',
          'minutos: duração total, com aquecimento e desaquecimento',
          'resultado em unidades arbitrárias (UA)',
        ]}
      >
        carga da sessão = PSE × minutos
      </Formula>
      <p>
        A escala é uma versão da CR-10 de Borg: 0 é repouso, 1 muito leve, 3
        moderado, 5 forte, 7 muito forte, 10 máximo. A pergunta é sobre a sessão
        como um todo, não sobre o tiro mais duro nem sobre como você está agora.
        O protocolo de Foster pede a nota cerca de 30 minutos depois do fim,
        quando o último esforço já não domina a resposta. Na prática, dar a nota
        quando a atividade sobe, no mesmo dia, funciona bem se você for
        consistente.
      </p>

      <h2>Um exemplo com contas</h2>
      <p>A semana de uma corredora, com nota treino a treino:</p>
      <ul>
        <li>terça, 60 min com 5 × 4' no limiar, PSE 7: 420 UA</li>
        <li>quarta, 45 min de rodagem leve, PSE 3: 135 UA</li>
        <li>quinta, 50 min de rodagem moderada, PSE 4: 200 UA</li>
        <li>sábado, longão de 100 min, PSE 5: 500 UA</li>
        <li>domingo, 40 min de trote regenerativo, PSE 2: 80 UA</li>
      </ul>
      <p>
        A carga semanal é de 1.335 UA. O treino de limiar é 15% do tempo de
        treino, mas quase um terço da carga, o que bate com o jeito como a
        maioria dos corredores descreveria a semana. Foster (1998) também tirou
        dois indicadores semanais dos valores diários. A monotonia é a carga
        diária média dividida pelo seu desvio-padrão: aqui 191 / 184 ≈ 1,0, com
        dois dias de descanso e um contraste real entre dias fortes e leves. O
        strain é carga semanal × monotonia, cerca de 1.390. Treinar todo dia a
        mesma dose moderada faz a monotonia subir, e nos dados de Foster as
        doenças tendiam a aparecer depois de semanas de strain alto.
      </p>

      <h2>Como usar no treino</h2>
      <p>
        Dê nota a todas as sessões, inclusive as leves e a academia. Buracos
        deixam o total semanal sem sentido. Depois olhe a tendência: uma semana
        30% acima das anteriores é um salto, seja qual for o número absoluto.
        Comparar o esforço planejado com o registrado costuma dizer mais que a
        própria carga. Uma rodagem leve com nota 5 em vez de 3, ou um treino de
        limiar que pareceu um 9, avisa de fadiga, calor ou doença antes de
        qualquer curva.
      </p>
      <p>
        A PSE da sessão rende mais ao lado de uma medida objetiva. Quando o{' '}
        <Link href="/pt-br/learn/trimp">TRIMP</Link> fica estável enquanto a PSE
        sobe para os mesmos treinos, o corpo está pagando mais pelo mesmo
        trabalho. Treinadores usam justamente essa diferença para ajustar os
        dias seguintes.
      </p>
      <p>
        Na OpenAthlete, cada atividade tem uma PSE de 0 a 10, e o treinador pode
        exigi-la para que a sessão conte como validada. A tela de carga mostra a
        PSE da sessão (PSE × minutos) ao lado do TRIMP por frequência cardíaca.
        Com os recursos de IA ativados, algumas perguntas curtas depois da
        atividade podem preencher a PSE a partir da resposta do atleta. Mais
        detalhes na{' '}
        <Link href="/pt-br/features/training-load">
          página de carga de treino
        </Link>
        .
      </p>

      <h2>Limites</h2>
      <p>
        Ela é subjetiva, e isso é ao mesmo tempo a graça e o ponto fraco. As
        notas mudam com o humor, a motivação e a experiência; iniciantes tendem
        a espremer tudo entre 4 e 7. As unidades arbitrárias não se convertem em
        TRIMP nem em TSS, então não dá para misturar os números na mesma curva
        sem reescalar. A duração pesa de forma linear: três horas de pedal leve
        com PSE 3 (540 UA) superam um treino de tiros de 40 minutos com PSE 8
        (320 UA), o que é certo para a carga total e enganoso para o estresse
        específico da intensidade. E uma nota não diz por que a sessão foi dura.
        A revisão de Haddad e colegas (2017) conclui que a PSE da sessão é
        válida em muitos esportes, com correlações com os métodos por frequência
        cardíaca em geral boas, mas longe de perfeitas. Use-a como uma segunda
        opinião sempre disponível, não como o único número.
      </p>
    </div>
  );
}
