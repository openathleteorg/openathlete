import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        O FTP (<em>functional threshold power</em>, potência de limiar
        funcional) é a maior potência que você consegue sustentar de forma mais
        ou menos estável por cerca de uma hora, em watts. Andrew Coggan o
        definiu como um substituto prático dos limiares de laboratório, e o
        livro de Hunter Allen e Coggan,{' '}
        <em>Training and Racing with a Power Meter</em>, fez dele a referência
        do treino de ciclismo: zonas, treinos e cargas são expressos em
        percentual do FTP. Os medidores de potência para corrida levaram depois
        a mesma ideia para a corrida.
      </p>
      <p>
        O FTP é um número de campo, medido com um medidor de potência e um
        esforço máximo, não uma fronteira fisiológica medida em laboratório. O
        parente mais próximo na fisiologia é a potência crítica, que vale
        entender junto: os dois costumam ficar a poucos watts um do outro e
        mesmo assim não são a mesma coisa.
      </p>

      <h2>Como estimar o FTP</h2>
      <p>
        A definição original é a potência média de um contrarrelógio de uma
        hora. Pouca gente quer fazer isso com frequência, então o teste comum
        são 20 minutos no máximo, em geral precedidos de um esforço forte de 5
        minutos para gastar parte da reserva anaeróbia, com o resultado reduzido
        em 5%:
      </p>
      <Formula
        where={[
          'P20 = potência média de um esforço máximo de 20 minutos, em watts',
        ]}
      >
        FTP ≈ 0,95 × P20
      </Formula>
      <p>
        O fator 0,95 corrige, em média, o fato de que você aguenta mais potência
        por 20 minutos do que por 60. Para alguns ciclistas funciona bem, para
        outros não, como mostram os limites mais abaixo.
      </p>

      <h2>A potência crítica</h2>
      <p>
        A potência crítica vem de Monod e Scherrer (1965). Coloque seus melhores
        esforços num gráfico de trabalho total por tempo: entre uns 2 e 20
        minutos, os pontos caem sobre uma reta. A inclinação é a potência
        crítica (CP); o intercepto, W′ (“W linha”), é uma quantidade fixa de
        trabalho que você consegue fazer acima da CP antes de precisar diminuir:
      </p>
      <Formula
        where={[
          'CP = potência crítica, em watts',
          'W′ = capacidade de trabalho acima da CP, em joules',
          't = duração do esforço, em segundos',
        ]}
      >
        P(t) = CP + W′ / t
      </Formula>
      <p>
        Na fisiologia, a CP marca a fronteira entre o domínio pesado, em que o
        consumo de oxigênio e o lactato se estabilizam, e o domínio severo, em
        que continuam subindo até você parar (Poole et al., 2016). Acima da CP,
        cada segundo gasta um pouco de W′; abaixo, W′ se recarrega devagar. O
        equivalente na corrida, com velocidade no lugar de potência, é a{' '}
        <Link href="/pt-br/learn/critical-speed">velocidade crítica</Link>.
      </p>

      <h2>Um exemplo com números</h2>
      <p>
        Uma ciclista faz 262 W de média num teste de 20 minutos. Seus melhores
        esforços recentes são 340 W em 3 minutos, 310 W em 5, 275 W em 12 e
        esses 262 W em 20.
      </p>
      <ul>
        <li>FTP ≈ 0,95 × 262 = 249 W</li>
        <li>
          Ajustando trabalho por tempo nos quatro esforços (61,2; 93,0; 198,0 e
          314,4 kJ), chega-se a CP = 248 W e W′ = 18,0 kJ
        </li>
        <li>
          Potência prevista para 10 minutos: 248 + 17.965 / 600 = 278 W,
          coerente com os recordes de 5 e 12 minutos ao redor
        </li>
        <li>
          Um ataque a 400 W gasta 400 − 248 = 152 joules de W′ por segundo,
          então 17.965 / 152 ≈ 118 segundos até esvaziar a reserva
        </li>
      </ul>
      <p>
        Aqui FTP e CP batem quase no watt. Isso é comum na média e pouco
        confiável no individual: em 17 ciclistas treinados, Karsten et al.
        (2021) encontraram CP média de 256 W e FTP de 249 W, mas a diferença
        para cada ciclista ia de uns 19 W para um lado a 33 W para o outro.
      </p>

      <h2>Como usar o FTP no treino</h2>
      <p>
        As zonas de potência clássicas de Coggan são percentuais do FTP. Com 249
        W: resistência (56–75%) de 139 a 187 W, tempo (76–90%) de 189 a 224 W,
        limiar (91–105%) de 227 a 261 W e VO2máx (106–120%) de 264 a 299 W. Daí
        saem os treinos típicos:
      </p>
      <ul>
        <li>2 × 20 minutos a 95–100% do FTP (237 a 249 W), 5 minutos leves</li>
        <li>3 × 12 minutos a 100–105% com 4 minutos de recuperação</li>
        <li>5 × 4 minutos a 110–120% (274 a 299 W), recuperação igual</li>
        <li>Pedais longos de 2 a 4 horas abaixo de 75%</li>
      </ul>
      <p>
        CP e W′ acrescentam o que o FTP não diz: quanto tempo você aguenta acima
        do limiar. Ajuda a dosar uma subida, um contrarrelógio curto ou uma
        prova cheia de mudanças de ritmo. Refaça o teste a cada seis a oito
        semanas, ou antes se os treinos de limiar ficarem fáceis ou impossíveis
        demais.
      </p>
      <p>
        No OpenAthlete, o FTP de ciclismo e de corrida é uma métrica que você
        informa ou sincroniza; o app não aplica teste. Os passos do{' '}
        <Link href="/pt-br/features/workout-builder">criador de treinos</Link>{' '}
        podem ter como alvo um percentual do FTP ou da potência crítica. A visão
        Capacidades das estatísticas calcula a potência crítica a partir dos
        seus melhores valores de potência no ciclismo entre 2 e 20 minutos e
        mostra um intervalo de 95%: esses valores vêm do treino, não de testes
        máximos, então o resultado é no máximo o que eles mostram.
      </p>

      <h2>Limites</h2>
      <p>
        A hora da definição é aproximada. Quando Borszcz et al. (2018) pediram a
        23 ciclistas treinados que pedalassem no FTP de 20 minutos até a
        exaustão, eles aguentaram 50,9 minutos em média, com desvio-padrão de
        quase 16 minutos: alguns passaram bem de uma hora, outros pararam por
        volta da metade. Quem tem grande capacidade anaeróbia tira um FTP
        inflado do teste de 20 minutos; os perfis “diesel”, um FTP baixo demais.
      </p>
      <p>
        As condições do teste também mexem no número: calor no rolo sem
        ventilação suficiente, saída rápida demais, cansaço, motivação. A
        potência crítica tem os seus pontos fracos. Depende das durações
        escolhidas, falha fora de uns 2 a 20 minutos, e esforços tirados de
        pedais comuns raramente são máximos. Nenhum dos dois diz nada sobre
        durabilidade, quanto dessa potência sobra depois de três horas de selim.
        Para a intensidade em batimentos, veja a{' '}
        <Link href="/pt-br/learn/heart-rate-reserve">
          frequência cardíaca de reserva
        </Link>
        ; para os limiares de laboratório que o FTP tenta aproximar, o{' '}
        <Link href="/pt-br/learn/lactate-threshold">limiar de lactato</Link>.
      </p>
    </div>
  );
}
