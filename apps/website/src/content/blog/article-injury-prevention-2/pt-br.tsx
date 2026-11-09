import Link from 'next/link';

import { Sources } from './sources';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Faz dois meses que você corre uns 40 km por semana. Sua maratona é daqui
        a 16 semanas e você gostaria que as semanas mais pesadas chegassem a 70
        km. Este artigo é sobre como ir de um número ao outro sem passar a
        semana 9 com gelo na canela. Ele é prático de propósito: para o que a
        pesquisa diz, e não diz, sobre carga e lesão, leia{' '}
        <Link href="/pt-br/blog/preventing-training-injuries">
          lesões na corrida e carga de treino
        </Link>
        .
      </p>

      <h2>A regra dos 10% é um teto que alguém inventou</h2>
      <p>
        Ninguém sabe ao certo de onde veio a regra dos 10%, e ela foi muito
        menos testada do que a fama sugere. Quando pesquisadores holandeses
        deram a 532 iniciantes uma planilha padrão de 8 semanas ou uma mais
        lenta, de 13 semanas, com aumentos de 10%, as taxas de lesão foram
        iguais: cerca de um corredor em cada cinco nos dois grupos (Buist et
        al., 2008). Uma coorte dinamarquesa com 874 iniciantes só achou um
        possível sinal acima de 30% em duas semanas, e mesmo assim no limite da
        significância (Nielsen et al., 2014).
      </p>
      <p>
        E a regra erra para os dois lados. Com volume baixo, é lenta demais: 20
        km por semana viram 22. Com volume maior, aplicada toda semana sem
        pausa, ela dispara. Quarenta quilômetros mais 10% por semana durante dez
        semanas dão 104 km. Ninguém deveria fazer isso, e mesmo assim é o que a
        regra diz.
      </p>
      <p>
        O que os estudos e o consenso do COI sobre carga (Soligard et al., 2016)
        sustentam é a ideia geral: aumentar aos poucos, evitar saltos grandes e
        repentinos e se ajustar à pessoa. O resto é julgamento de treinador, e
        vou apresentar como tal.
      </p>

      <h2>Como eu aumento o volume</h2>
      <p>
        <strong>Um degrau, depois um patamar.</strong> Acrescente um bloco, uns
        4 a 6 km ou 30 minutos, e fique nesse nível por uma ou duas semanas
        antes do próximo degrau. Na minha experiência, o corredor absorve melhor
        um nível que já repetiu do que um recorde novo toda semana. É
        observação, não dado de ensaio clínico.
      </p>
      <p>
        <strong>Semana regenerativa a cada três ou quatro.</strong> Corte o
        volume entre um quarto e um terço e mantenha um treino curto de
        qualidade, por exemplo 6 × 1&apos; forte na quarta-feira, para não
        chegar travado ao bloco seguinte. O percentual exato não tem estudo
        sólido por trás. O hábito de planejar essa semana antes de precisar
        dela, sim.
      </p>
      <p>
        <strong>Uma novidade de cada vez.</strong> Não acrescente 6 km na mesma
        semana do primeiro treino de pista da temporada, da primeira trilha
        longa com subida ou de um tênis novo com menos drop. O ensaio Run Clever
        mostrou que progredir a intensidade ou o volume dava taxas de lesão
        parecidas (Ramskov et al., 2018). Progredir os dois ao mesmo tempo não
        era a pergunta, e eu não me candidataria para descobrir.
      </p>
      <p>
        <strong>O longão segue seu próprio caminho.</strong> De dez a quinze
        minutos a mais cada vez que ele sobe e, no começo do ciclo, no máximo
        cerca de um terço da semana. Um corredor de 40 km que faz um longão de
        25 km concentra quase a semana inteira num treino só.
      </p>
      <p>
        <strong>Conte o que realmente pesa.</strong> No asfalto, quilômetros são
        uma boa aproximação. Na trilha, conte tempo e altimetria: 1.000 m de
        descida numa semana são um estresse que nenhuma distância mostra, e seus
        quadríceps vão avisar com dois dias de atraso.
      </p>
      <p>
        <strong>Respeite as pausas.</strong> Depois de alguns dias parado, siga
        de onde estava. Depois de duas ou três semanas, eu recomeço com metade a
        dois terços do volume anterior e reconstruo em três ou quatro semanas.
        Sua média recente caiu, mesmo que a lembrança dela não tenha caído.
      </p>

      <h2>Um exemplo de 16 semanas</h2>
      <p>
        Veja como poderia ficar a progressão de 40 para 70 km. As durações do
        longão consideram um pace leve de uns 6:00 por km.
      </p>
      <table>
        <thead>
          <tr>
            <th>Semana</th>
            <th>Volume</th>
            <th>Longão</th>
            <th>Observação</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>40 km</td>
            <td>1h20</td>
            <td>Nível atual</td>
          </tr>
          <tr>
            <td>2</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>Primeiro degrau</td>
          </tr>
          <tr>
            <td>3</td>
            <td>44 km</td>
            <td>1h30</td>
            <td>Patamar</td>
          </tr>
          <tr>
            <td>4</td>
            <td>34 km</td>
            <td>1h15</td>
            <td>Regenerativa</td>
          </tr>
          <tr>
            <td>5</td>
            <td>48 km</td>
            <td>1h40</td>
            <td></td>
          </tr>
          <tr>
            <td>6</td>
            <td>52 km</td>
            <td>1h45</td>
            <td></td>
          </tr>
          <tr>
            <td>7</td>
            <td>52 km</td>
            <td>1h50</td>
            <td>Patamar</td>
          </tr>
          <tr>
            <td>8</td>
            <td>40 km</td>
            <td>1h30</td>
            <td>Regenerativa</td>
          </tr>
          <tr>
            <td>9</td>
            <td>56 km</td>
            <td>2h00</td>
            <td></td>
          </tr>
          <tr>
            <td>10</td>
            <td>60 km</td>
            <td>2h05</td>
            <td></td>
          </tr>
          <tr>
            <td>11</td>
            <td>60 km</td>
            <td>2h15</td>
            <td>Patamar</td>
          </tr>
          <tr>
            <td>12</td>
            <td>46 km</td>
            <td>1h40</td>
            <td>Regenerativa</td>
          </tr>
          <tr>
            <td>13</td>
            <td>65 km</td>
            <td>2h20</td>
            <td></td>
          </tr>
          <tr>
            <td>14</td>
            <td>70 km</td>
            <td>2h30</td>
            <td>Pico</td>
          </tr>
          <tr>
            <td>15</td>
            <td>52 km</td>
            <td>1h45</td>
            <td>Polimento</td>
          </tr>
          <tr>
            <td>16</td>
            <td>30 km + prova</td>
            <td>Prova</td>
            <td>Semana da prova</td>
          </tr>
        </tbody>
      </table>
      <p>
        Olhe a semana 5. Comparada com a semana regenerativa anterior, é um
        salto de 41%, o bastante para disparar todos os alertas de um app
        baseado em índices. Comparada com as semanas 2 e 3, o nível em que o
        corredor treinava de fato, são 9%. Compare uma semana nova com o treino
        de antes da regenerativa, não com a regenerativa.
      </p>
      <p>
        Repare também no que a planilha não faz: ela nunca soma volume e um tipo
        novo de treino na mesma semana, e o pico fica duas semanas antes da
        prova, não uma. Se o seu objetivo é um trail com muita altimetria,
        troque quilômetros por horas e acrescente uma coluna de ganho de
        elevação.
      </p>

      <h2>Com o que comparar uma semana</h2>
      <p>
        Se você quer um número só, compare esta semana com a média das três ou
        quatro anteriores, sem incluir esta semana na média. Use isso como
        convite para olhar com mais atenção, não como veredito. A famosa relação
        carga aguda:crônica e sua "zona ideal" entre 0,8 e 1,3 foram duramente
        criticadas, inclusive por essa mesma contagem dupla (Impellizzeri et
        al., 2020). Não existe limite validado, nem para você nem para ninguém.
      </p>

      <h2>Quando segurar ou recuar</h2>
      <p>
        Pare de progredir, e em geral de correr por alguns dias, se uma dor muda
        sua passada, piora durante o treino ou está pior na manhã seguinte. Dor
        num ponto exato de um osso, como a canela ou o peito do pé, merece a
        avaliação de um profissional antes do próximo treino, não depois dos
        próximos três.
      </p>
      <p>
        Segure o nível atual, ou antecipe a semana regenerativa, se os treinos
        leves parecerem mais pesados que o normal vários dias seguidos, se o
        mesmo pace leve custar mais batimentos ou se o sono piorar. São os
        primeiros sinais descritos em{' '}
        <Link href="/pt-br/blog/5-signs-of-overtraining-and-how-to-avoid-it">
          overtraining e overreaching
        </Link>
        . Adiar um degrau em uma semana quase não custa nada. Uma fratura por
        estresse custa a prova.
      </p>

      <h2>Planejando no OpenAthlete</h2>
      <p>
        A visão de temporada do OpenAthlete permite desenhar uma progressão como
        esta em blocos (base, específico, polimento, recuperação) com a sua
        prova por cima, e cada semana mostra sua carga em relação a uma faixa
        construída a partir das suas semanas recentes. Essa faixa é uma
        referência para enquadrar a semana, não um limite de segurança.
        Condicionamento, fadiga e forma são projetados sobre os treinos
        planejados, então você vê o efeito de uma semana regenerativa na sua
        forma antes de corrê-la. A dor mencionada nas perguntas opcionais depois
        de cada atividade vai para um registro de lesões que o seu treinador vê.
        Mais detalhes nas páginas de{' '}
        <Link href="/pt-br/features/training-calendar">
          calendário de treino
        </Link>{' '}
        e <Link href="/pt-br/features/training-load">carga de treino</Link>.
      </p>

      <h2>Fontes</h2>
      <Sources />
    </div>
  );
}
