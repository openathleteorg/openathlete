import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Treino polarizado descreve um jeito de distribuir a intensidade: a maior
        parte do volume claramente leve, uma fatia menor mas real claramente
        forte, e muito pouco no meio. A ideia não saiu de um protocolo de
        laboratório, e sim da observação do que atletas de endurance de elite
        fazem de verdade. Revisando os estudos descritivos, Stephen Seiler viu
        que atletas de nível nacional e internacional que treinam de 10 a 13
        vezes por semana tendem a fazer cerca de 80% das sessões em baixa
        intensidade e 20% dominadas por trabalho forte, como tiros em torno de
        90% do VO2máx (Seiler, 2010).
      </p>
      <p>
        Esse padrão costuma ser resumido como “80/20”. O atalho esconde dois
        detalhes importantes: quais zonas você conta e se conta sessões ou
        minutos.
      </p>

      <h2>As três zonas</h2>
      <p>
        O treino polarizado usa um modelo de três zonas baseado em dois limiares
        fisiológicos. A zona 1 fica abaixo do primeiro limiar ventilatório ou{' '}
        <Link href="/pt-br/learn/lactate-threshold">limiar de lactato</Link>{' '}
        (lactato no sangue por volta de 2 mmol/L): rodagem leve em que dá para
        conversar em frases completas. A zona 2 fica entre os dois limiares. A
        zona 3 começa acima do segundo limiar (por volta de 4 mmol/L, perto da{' '}
        <Link href="/pt-br/learn/critical-speed">velocidade crítica</Link>),
        onde ficam os tiros.
      </p>
      <p>
        Cuidado com a confusão de nomes. Nos sistemas de cinco zonas da maioria
        dos relógios, a “<Link href="/pt-br/learn/zone-2">zona 2</Link>” é a
        rodagem leve, que cai dentro da zona 1 do modelo de três zonas. O treino
        polarizado não pede que você evite esses treinos leves; pede que passe
        pouco tempo entre os dois limiares.
      </p>

      <h2>Colocando um número</h2>
      <p>
        Treff e colegas (2019) propuseram um índice de polarização para separar
        uma distribuição polarizada das outras, a partir da fração do tempo (ou
        da distância) de treino em cada uma das três zonas:
      </p>
      <Formula
        where={[
          'Z1, Z2, Z3 = fração do tempo total em cada zona (0,80 para 80%), Z1 + Z2 + Z3 = 1',
          'Válido se Z1 > Z3 > Z2. Se Z3 = 0, PI = 0. Se Z2 = 0, use 0,01 para Z2 e Z3 − 0,01 para Z3',
          'PI > 2,00: polarizado. PI ≤ 2,00: não polarizado',
        ]}
      >
        PI = log10(Z1 / Z2 × Z3 × 100)
      </Formula>

      <h2>Um exemplo com números</h2>
      <p>
        Uma corredora treina 8 horas por semana. Em um mês, o tempo dela por
        zona fica em 80% na zona 1, 5% na zona 2 e 15% na zona 3.
      </p>
      <ul>
        <li>Z1 / Z2 = 0,80 / 0,05 = 16</li>
        <li>16 × 0,15 × 100 = 240</li>
        <li>PI = log10(240) = 2,38, acima de 2,00: polarizado</li>
      </ul>
      <p>
        Mude a mistura para 75% / 20% / 5%, uma pirâmide com bastante ritmo e
        poucos tiros: PI = log10(0,75 / 0,20 × 0,05 × 100) = log10(18,75) =
        1,27. Um bloco focado no limiar, 60% / 35% / 5%, dá 0,93. Mesmas horas
        por semana, três semanas bem diferentes.
      </p>

      <h2>Sessões ou minutos?</h2>
      <p>
        O 80/20 de Seiler conta sessões. O tempo por zona mostra outra coisa,
        porque um treino forte é feito principalmente de aquecimento,
        recuperações e desaquecimento. Um treino de 70 minutos com 5 × 4' em
        pace de 3 a 5 km tem 20 minutos de trabalho, e como a frequência
        cardíaca sobe com atraso, o relógio registra ainda menos na zona 3.
        Seiler e Kjerland (2006) mediram dos dois jeitos em onze esquiadores de
        fundo juniores durante 32 dias: pela frequência cardíaca, as sessões de
        endurance se dividiram em 75% / 8% / 17% entre as três zonas, e a PSE da
        sessão deu quase o mesmo. Quatro rodagens de uma hora mais esse treino
        de tiros formam uma semana 80/20 por sessões, mas só 20 dos 310 minutos,
        cerca de 6%, são fortes. Nenhuma das leituras está errada, mas compare
        igual com igual.
      </p>

      <h2>Como aplicar</h2>
      <p>
        Para quem treina cinco ou seis vezes por semana, uma semana polarizada
        pode ser assim: três ou quatro rodagens leves e um longão, todos abaixo
        do primeiro limiar, mais um ou dois treinos fortes como 5 × 4' ou 6 × 3'
        em pace de 3 a 5 km, com trote de recuperação da mesma duração. Os dias
        leves precisam continuar leves, o que para quase todo mundo significa
        mais devagar do que gostaria; defina o teto com a{' '}
        <Link href="/pt-br/tools/heart-rate-zones">
          calculadora de zonas de frequência cardíaca
        </Link>{' '}
        ou com o teste da fala. As estatísticas do OpenAthlete mostram a fatia
        do treino abaixo, entre e acima dos seus limiares, o suficiente para
        conferir que tipo de semana você realmente correu.
      </p>

      <h2>Limites</h2>
      <p>
        O apoio experimental mais forte vem de Stöggl e Sperlich (2014): 48
        corredores, ciclistas, triatletas e esquiadores bem treinados seguiram
        por nove semanas um de quatro programas, e o grupo polarizado melhorou o
        VO2pico em 11,7% e o tempo até a exaustão em 17,4%, mais que os grupos
        de volume, limiar ou tiros. Nove semanas e 48 atletas divididos em
        quatro grupos é um estudo curto e pequeno, com pessoas que já estavam em
        forma. O próprio Seiler (2010) apresenta o 80/20 como descritivo: é para
        onde convergem os atletas de sucesso, não a prova de que seja o ideal
        para todos. Quem tem quatro horas por semana talvez ganhe mais com algum
        treino de limiar do que com uma polarização rígida; a questão segue
        aberta. Por fim, as zonas dependem de limiares que precisam ser testados
        ou estimados, e um erro de 10 batimentos joga minutos de uma zona para
        outra.
      </p>
    </div>
  );
}
