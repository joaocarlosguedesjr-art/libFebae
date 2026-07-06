import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalConfig } from "@/lib/lgpd";

export const metadata = {
  title: "Termos de Uso — Biblioteca",
};

export const dynamic = "force-dynamic";

export default async function TermosPage() {
  const config = await getLegalConfig();

  return (
    <LegalPageLayout
      title="Termos de Uso"
      version={config.termsVersion}
      updatedAt="03/07/2026"
      config={config}
    >
      <h2>1. Aceite</h2>
      <p>
        Ao utilizar o sistema da biblioteca de <strong>{config.institutionName}</strong>,
        você declara ter lido e concordado com estes Termos de Uso e com a{" "}
        <a href="/privacidade">Política de Privacidade</a>.
      </p>

      <h2>2. Serviço</h2>
      <p>
        O sistema permite consulta ao acervo, gestão de empréstimos (para usuários
        cadastrados) e administração pelo bibliotecário. O catálogo público pode ser
        acessado sem login.
      </p>

      <h2>3. Cadastro de leitores</h2>
      <p>
        O cadastro é realizado presencialmente ou sob orientação do bibliotecário. É
        vedado compartilhar credenciais de acesso. O titular deve fornecer dados
        verídicos e manter suas informações atualizadas.
      </p>

      <h2>4. Uso adequado</h2>
      <ul>
        <li>Utilizar o sistema apenas para fins relacionados à biblioteca;</li>
        <li>Devolver obras nos prazos acordados;</li>
        <li>Não tentar acessar áreas ou dados de outros usuários;</li>
        <li>Não utilizar o assistente de busca para conteúdo ilícito ou abusivo.</li>
      </ul>

      <h2>5. Responsabilidades</h2>
      <p>
        A instituição envidará esforços para manter o serviço disponível, sem garantia de
        disponibilidade ininterrupta. O leitor é responsável pelas obras emprestadas até a
        devolução registrada no sistema.
      </p>

      <h2>6. Propriedade intelectual</h2>
      <p>
        As informações catalográficas e o software pertencem à instituição ou aos respectivos
        titulares. É permitida a consulta pessoal; a reprodução em massa depende das regras
        de direito autoral aplicáveis.
      </p>

      <h2>7. Encerramento de acesso</h2>
      <p>
        O acesso pode ser suspenso em caso de violação destes termos ou mediante solicitação
        do titular, observadas pendências de empréstimo e obrigações legais.
      </p>

      <h2>8. Legislação aplicável</h2>
      <p>
        Estes termos são regidos pelas leis da República Federativa do Brasil, em especial
        a Lei nº 13.709/2018 (LGPD) e o Marco Civil da Internet (Lei nº 12.965/2014).
      </p>

      <h2>9. Contato</h2>
      <p>
        Dúvidas: <a href={`mailto:${config.institutionEmail}`}>{config.institutionEmail}</a>
        . Versão vigente: {config.termsVersion}.
      </p>
    </LegalPageLayout>
  );
}
