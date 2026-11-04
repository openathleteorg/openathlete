import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        O TRIMP, de <em>training impulse</em>, transforma uma sessão em um único
        número a partir de dois dados que o seu relógio já registra: quanto
        tempo você treinou e quão alta ficou a frequência cardíaca. Eric
        Banister propôs o TRIMP nos anos 1970 como entrada do seu modelo de
        condicionamento e fadiga, e a maioria dos gráficos de carga baseados em
        frequência cardíaca ainda usa alguma versão dele. Dá para calcular à
        mão, e esse é o melhor jeito de entender o que ele capta e o que deixa
        passar.
      </p>

      <h2>Como o TRIMP é calculado</h2>
      <p>
        O TRIMP de Banister pega a fração da frequência cardíaca de reserva que
        você usou, multiplica pela duração e aplica um peso exponencial, de modo
        que um minuto perto do limiar custa muito mais do que um minuto de
        trote:
      </p>
      <Formula
        where={[
          'FCr = (FC − FCrepouso) / (FCmáx − FCrepouso), a fração da frequência cardíaca de reserva',
          'y = 0,64 e k = 1,92 para homens; y = 0,86 e k = 1,67 para mulheres',
        ]}
      >
        TRIMP = minutos × FCr × y × e^(k × FCr)
      </Formula>
      <p>
        O peso foi ajustado à forma como o lactato sobe com a frequência
        cardíaca: quase plano em ritmos leves, íngreme perto do limiar (Morton,
        Fitz-Clarke e Banister, 1990). Os dois conjuntos de coeficientes são
        médias dos homens e das mulheres desses estudos. Ninguém mostrou que
        eles se encaixam bem em um atleta específico, então um TRIMP de 112 não
        é de fato mais preciso que um de 105.
      </p>
      <p>
        Você pode aplicar a fórmula uma vez só, com a frequência média da sessão
        inteira, ou minuto a minuto (segundo a segundo, com o registro completo)
        e somar. O segundo jeito é melhor, e o exemplo abaixo mostra o porquê.
      </p>

      <h2>Um exemplo com contas</h2>
      <p>
        Um corredor com frequência de repouso de 48 e máxima de 188 tem uma
        reserva de 140 batimentos. Ele corre 45 minutos a 150 bpm de média.
      </p>
      <ul>
        <li>FCr = (150 − 48) / 140 = 0,729</li>
        <li>Peso = 0,64 × e^(1,92 × 0,729) = 0,64 × 4,05 = 2,59</li>
        <li>TRIMP = 45 × 0,729 × 2,59 = 85</li>
      </ul>
      <p>
        Com os coeficientes femininos, a mesma corrida dá 95. Mesmo coração,
        mesmo treino, 12% de diferença só pela escolha dos coeficientes.
      </p>
      <p>
        Agora divida 20 minutos com a mesma média de outro jeito: 10 minutos a
        175 bpm e 10 minutos a 125 bpm. Calculado pela média (150 bpm por 20
        minutos), o TRIMP é 38. Calculado bloco a bloco, é 33 + 10 = 43, cerca
        de 15% a mais. Como o peso é exponencial, os minutos fortes somam mais
        do que os leves tiram, e a média achata justamente o que cansa. É por
        isso que treinos de tiros saem subestimados quando só a frequência média
        é usada.
      </p>

      <h2>Como usar no treino</h2>
      <p>
        A pontuação de uma sessão isolada diz pouco. O TRIMP fica útil quando
        você soma: um total semanal para comparar blocos e uma série diária que
        alimenta as{' '}
        <Link href="/pt-br/learn/ctl-atl-tsb">
          curvas de condicionamento, fadiga e forma
        </Link>{' '}
        (CTL, ATL, TSB). Alguns hábitos ajudam:
      </p>
      <ul>
        <li>
          Mantenha a frequência de repouso e a máxima atualizadas. Uma máxima 10
          batimentos acima da real reduz cada FCr e derruba todas as pontuações.
        </li>
        <li>
          Compare você com você. Um total de 600 por semana não quer dizer nada
          sozinho; passar de 450 para 650 em duas semanas quer.
        </li>
        <li>
          Leia o TRIMP junto com a sensação do treino. Quando uma rodagem de
          sempre marca 20% a mais que o normal, calor, uma noite mal dormida ou
          um resfriado chegando explicam mais do que uma mudança repentina de
          condicionamento.
        </li>
      </ul>
      <p>
        A OpenAthlete calcula o TRIMP de Banister a partir da frequência
        cardíaca segundo a segundo de cada atividade (pela média quando não há
        registro), com os coeficientes acima, e mostra a{' '}
        <Link href="/pt-br/learn/session-rpe">PSE da sessão</Link> ao lado. A{' '}
        <Link href="/pt-br/features/training-load">
          página de carga de treino
        </Link>{' '}
        tem uma calculadora e links para o código-fonte.
      </p>

      <h2>Limitações</h2>
      <p>
        A frequência cardíaca é uma medida interna e reage com atraso. Em tiros
        de 30 segundos ou subidas curtas, ela mal tem tempo de subir, então o
        TRIMP subestima o trabalho anaeróbio e neuromuscular. Musculação,
        descidas e o dano muscular de uma prova de trilha quase não aparecem.
        Calor, desidratação, cafeína e altitude aumentam a frequência cardíaca
        para o mesmo trabalho, e o{' '}
        <Link href="/pt-br/learn/aerobic-decoupling">drift cardíaco</Link> infla
        a segunda metade dos esforços longos. Por fim, a fórmula ignora o
        esporte: uma hora a 140 bpm na bike e uma hora a 140 bpm correndo dão a
        mesma pontuação, embora a corrida costume deixar mais marcas. Combine o
        TRIMP com uma medida subjetiva e leia o número como tendência, não como
        veredito.
      </p>
    </div>
  );
}
