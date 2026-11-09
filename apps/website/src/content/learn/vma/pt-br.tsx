import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        A VAM, velocidade aeróbia máxima (VMA em francês, MAS ou vVO2max em
        inglês), é a menor velocidade de corrida em que o seu consumo de
        oxigênio chega ao teto, o seu{' '}
        <Link href="/pt-br/learn/vo2max">VO2máx</Link>. Acima dela, a energia
        extra vem do metabolismo anaeróbio, e é por isso que a maioria dos
        corredores só sustenta a VAM por 4 a 8 minutos. O conceito nasceu no
        treinamento francês, com o teste de pista de Luc Léger em 1980 e os
        trabalhos de Véronique Billat nos anos 1990. A vantagem é prática: o
        VO2máx é um número de laboratório em mililitros; a VAM é uma velocidade
        que você corre na pista.
      </p>

      <h2>Como calcular a VAM</h2>
      <p>
        O método de campo mais direto é o teste de 6 minutos (meio Cooper).
        Depois de 20 minutos de aquecimento e algumas acelerações, você corre a
        maior distância possível em 6 minutos, em ritmo constante. Seis minutos
        cabem no tempo que quase todo mundo sustenta na VAM, então a sua
        velocidade média é uma boa estimativa:
      </p>
      <Formula
        where={[
          'distância em metros, tempo em minutos; × 0,06 converte m/min em km/h',
        ]}
      >
        VAM (km/h) = distância / tempo × 0,06
      </Formula>
      <p>
        O teste de Cooper de 12 minutos é mais fácil de dosar, mas dá um valor
        um pouco baixo: quase todo mundo diminui depois de 6 ou 7 minutos nessa
        velocidade. Os testes progressivos (o de Léger e Boucher, o VAMEVAL)
        sobem a velocidade 0,5 ou 1 km/h por estágio até você não conseguir mais
        acompanhar; o último estágio completo dá a VAM. Exigem pista, cones e um
        áudio de apoio, mas eliminam o problema do ritmo.
      </p>
      <p>
        Também dá para partir de uma prova recente. Cada distância é corrida a
        uma fração típica da VAM: cerca de 95% nos 5 km, 90% nos 10 km, 85% na
        meia maratona e 80% na maratona. Divida a sua velocidade média por essa
        fração. Um 5 ou 10 km plano estima melhor que uma maratona, em que
        hidratação, géis e calor pesam mais que a potência aeróbia.
      </p>

      <h2>Um exemplo com números</h2>
      <ul>
        <li>
          Teste de 6 minutos: 1.500 m → 1.500 / 6 × 0,06 = 15,0 km/h (4:00/km)
        </li>
        <li>
          Teste de Cooper, mesmo corredor: 2.900 m em 12 minutos → 14,5 km/h
        </li>
        <li>
          10 km em 45:00: 13,33 km/h de média, dividido por 0,90 → 14,8 km/h
        </li>
      </ul>
      <p>
        Três métodos, três resultados a menos de 0,5 km/h um do outro. Essa
        diferença é normal e lembra que a VAM é uma estimativa com margem, não
        um dado fixo como a sua altura. Com 15 km/h, os paces ficam assim:
      </p>
      <ul>
        <li>100% da VAM: 15,0 km/h, 4:00/km, 125 m em 30 segundos</li>
        <li>95%: 14,25 km/h, 4:13/km</li>
        <li>85% (perto do limiar para muitos): 12,75 km/h, 4:42/km</li>
        <li>65 a 75% (rodagem leve): 9,75 a 11,25 km/h, de 6:09 a 5:20/km</li>
      </ul>

      <h2>Como usar no treino</h2>
      <p>
        A VAM é a régua dos tiros. Formatos clássicos na VAM ou perto dela: o
        30/30 (30 segundos a 100% e 30 de trote) repetido de 10 a 20 vezes, 6 ×
        1.000 m a 95% com 2 minutos de recuperação, 5 × 3 minutos entre 95 e
        100%. Billat mostrou que o tempo sustentado na VAM varia muito entre
        corredores do mesmo nível (Billat e Koralsztein, 1996); por isso tiros
        curtos com recuperações curtas permitem acumular mais minutos nessa
        intensidade do que um único esforço longo.
      </p>
      <p>
        Abaixo da VAM, as porcentagens ficam menos confiáveis. Dois corredores
        de 15 km/h podem ter o limiar a 82% e a 90% da VAM, conforme a
        resistência e o histórico de treino. Para o ritmo de limiar e o longão,
        a frequência cardíaca (veja a{' '}
        <Link href="/pt-br/tools/heart-rate-zones">
          calculadora de zonas cardíacas
        </Link>
        ) ou paces tirados de provas, como o{' '}
        <Link href="/pt-br/learn/vdot">VDOT</Link>, costumam guiar melhor. A{' '}
        <Link href="/pt-br/tools/vma">calculadora de VAM</Link> transforma um
        teste ou uma prova em paces, e as{' '}
        <Link href="/pt-br/pace-charts">tabelas de pace</Link> fazem a conta por
        quilômetro.
      </p>
      <p>
        Na OpenAthlete, a VAM é uma das suas capacidades. Os passos de um treino
        podem mirar uma porcentagem dela (por exemplo 95%), e o treino chega com
        paces reais aos relógios Garmin, Suunto ou COROS.
      </p>

      <h2>Limitações</h2>
      <p>
        A VAM depende do teste: esteira, pista, rua com subidas ou um dia de
        vento dão números diferentes, e 6 minutos mal dosados podem custar 0,5
        km/h. Ela também mistura duas coisas, VO2máx e economia de corrida: dois
        corredores com o mesmo VO2máx podem ter 1 a 2 km/h de diferença de VAM
        se um corre de forma mais econômica. E diz pouco sobre resistência. Um
        corredor com VAM alta e pouca quilometragem vai quebrar numa meia que
        outro, com VAM menor e mais volume, termina tranquilo. Use a VAM para
        definir os paces dos tiros, refaça o teste a cada dois ou três meses e
        deixe as provas contarem o resto.
      </p>
    </div>
  );
}
