import Link from 'next/link';

export function ContentPtBr() {
  return (
    <div>
      <p>
        Alguns anos de histórico de treino são muito material: cada treino de
        tiros, cada curva de frequência cardíaca, cada anotação do tipo "dormi
        cinco horas, perna morta". Para um treinador é ainda mais: anos de
        treinos estruturados, modelos e temporadas montadas para cada atleta.
        Onde esse material fica, e quem decide o que acontece com ele, parece
        uma questão abstrata até o dia em que uma plataforma fecha ou muda de
        dono.
      </p>

      <h2>Plataformas fecham e mudam de dono</h2>
      <p>
        O Today's Plan, uma plataforma de treino e assessoria, fechou em março
        de 2024. Os usuários tiveram que exportar o que conseguiram e recomeçar
        em outro lugar. Em julho de 2026 a Garmin{' '}
        <a href="https://www.garmin.com/en-US/newsroom/press-release/corporate/garmin-acquires-trainingpeaks-and-trainheroic-leading-endurance-and-strength-training-platforms-for-athletes-and-coaches/">
          comprou o TrainingPeaks e o TrainHeroic
        </a>
        . O TrainingPeaks continua funcionando, e nada indica que vai tratar
        outras marcas de forma diferente. Mas as planilhas, as bibliotecas de
        treinos e as relações com os atletas de muitos treinadores de endurance
        agora pertencem a um fabricante de relógios, e as decisões sobre essa
        plataforma vão levar em conta os interesses da Garmin.
      </p>
      <p>
        Nada disso é escândalo. Empresas são compradas e às vezes quebram. A
        questão é que, numa plataforma fechada, o seu histórico de treino dura o
        mesmo que o negócio que o guarda.
      </p>

      <h2>O que "exportar seus dados" entrega de verdade</h2>
      <p>
        Na União Europeia, o artigo 20 do RGPD garante o direito à
        portabilidade: os dados que você forneceu, num formato estruturado e
        legível por máquina. No Brasil, a LGPD também prevê a portabilidade. Na
        prática, o que dá para levar varia muito. Arquivos de atividade (FIT,
        GPX) costumam sair sem problema, porque toda ferramenta lê. Treinos
        planejados, comentários do treinador, modelos e o jeito como uma
        temporada foi montada são outra história: costumam ficar num formato
        próprio da plataforma e, mesmo quando dá para exportar, pode ser que
        nenhuma outra ferramenta consiga importar.
      </p>
      <p>
        Dois hábitos ajudam, seja qual for a ferramenta. Faça as suas atividades
        chegarem a mais de um lugar, por exemplo da conta do relógio para a sua
        plataforma de treino e para um segundo serviço, para que nenhuma empresa
        tenha a única cópia. E peça uma exportação completa uma vez por ano,
        antes de precisar, para ver o que você realmente receberia.
      </p>

      <h2>O que o código aberto muda, e o que não muda</h2>
      <p>
        O código do OpenAthlete é{' '}
        <a href="https://github.com/openathleteorg/openathlete">público</a>.
        Isso tem algumas consequências concretas. Você pode ler como a carga de
        treino é calculada em vez de confiar numa caixa-preta. Pode ver quais
        dados saem do servidor e para onde vão. E, se o projeto parasse amanhã,
        o código, o esquema do banco de dados e os arquivos de migração
        continuariam lá, e qualquer pessoa poderia continuar rodando. Os dados
        ficam num banco PostgreSQL comum, não num formato que só uma empresa
        entende.
      </p>
      <p>
        Código aberto não deixa um software seguro por si só. Um código que
        ninguém lê não fica mais seguro por ser público, e um projeto pequeno
        tem menos revisores do que um popular. Também não garante que alguém vai
        continuar mantendo. O que ele garante é que você tem permissão para
        olhar, e que existe a opção de seguir sem o autor original.
      </p>

      <h2>Por que a AGPL</h2>
      <p>
        O OpenAthlete é distribuído sob a{' '}
        <a href="https://www.gnu.org/licenses/agpl-3.0.html">
          Licença Pública Geral Affero GNU v3
        </a>
        . Qualquer pessoa pode usar, modificar, rodar e redistribuir. A condição
        é que, se você modificar e deixar outras pessoas usarem a sua versão
        pela rede, precisa oferecer a elas o código-fonte dessa versão. A GPL
        comum não exige isso para um software usado como serviço web, e é por
        isso que existe a variante Affero.
      </p>
      <p>
        Na prática, ninguém pode pegar o OpenAthlete, acrescentar recursos e
        vender como um serviço hospedado fechado. As melhorias de quem roda o
        software para outras pessoas voltam para todos. A versão hospedada em
        openathlete.org usa o mesmo código público; recursos que só fazem
        sentido lá, como a cobrança, ficam desligados enquanto não forem
        configurados.
      </p>

      <h2>Auto-hospedagem, sem enfeite</h2>
      <p>
        Você pode instalar o OpenAthlete no seu próprio servidor com o{' '}
        <code>docker-compose.yml</code> do repositório ou com as imagens
        publicadas no GHCR. Ele precisa de PostgreSQL e Redis, ambos incluídos
        no arquivo compose. É gratuito, sem limite de atletas nem recurso pago.
        Uma instância auto-hospedada não envia nada ao OpenAthlete, e um teste
        automatizado confere isso a cada versão. Dá para conectar login único
        via OIDC, escolher cadastro aberto, por convite ou fechado, e rodar os
        recursos de IA num modelo local com Ollama, para que absolutamente nada
        saia da sua máquina.
      </p>
      <p>
        Os custos existem, porém. Backups, atualizações e segurança ficam por
        sua conta. As conexões com os relógios usam as suas próprias credenciais
        de desenvolvedor em cada provedor: algumas, como as do Strava, saem
        rápido, enquanto outras, como as da Garmin, passam por uma análise do
        pedido antes de liberar o acesso à API. O envio de arquivos FIT, GPX ou
        TCX funciona sem nada disso. A auto-hospedagem faz mais sentido para um
        treinador ou uma assessoria com alguém que se vire bem com servidor, ou
        para uma organização que precisa manter os dados dos atletas na própria
        infraestrutura. A{' '}
        <Link href="/pt-br/self-hosting">página de auto-hospedagem</Link>{' '}
        explica a instalação.
      </p>

      <h2>Se você prefere não cuidar de servidor</h2>
      <p>
        A versão hospedada é gratuita, com todos os recursos. A API e o banco de
        dados rodam na OVH, na França, e o app web é servido pela Vercel. O
        plano Supporter (5 € por mês ou 50 € por ano) acrescenta IA nas chaves
        do OpenAthlete e o acompanhamento de mais de cinco atletas, e ajuda a
        pagar os servidores. Os motivos por trás do projeto estão na{' '}
        <Link href="/pt-br/open-source">página sobre código aberto</Link>.
      </p>
    </div>
  );
}
