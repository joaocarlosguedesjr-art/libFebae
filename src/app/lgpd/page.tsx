import Link from "next/link";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { DATA_SUBJECT_REQUEST_LABELS, getLegalConfig } from "@/lib/lgpd";

export const metadata = {
  title: "Seus direitos — LGPD",
};

export const dynamic = "force-dynamic";

export default async function LgpdPage() {
  const config = await getLegalConfig();

  return (
    <LegalPageLayout
      title="Seus direitos na LGPD"
      version={config.privacyPolicyVersion}
      updatedAt="03/07/2026"
      config={config}
    >
      <p>
        A Lei Geral de Proteção de Dados (Lei nº 13.709/2018) garante aos titulares os
        direitos abaixo em relação aos dados pessoais tratados por{" "}
        <strong>{config.institutionName}</strong>.
      </p>

      <h2>Direitos do titular</h2>
      <ul>
        {Object.entries(DATA_SUBJECT_REQUEST_LABELS).map(([key, label]) => (
          <li key={key}>
            <strong>{label}</strong>
          </li>
        ))}
      </ul>

      <h2>Como exercer seus direitos</h2>
      <ol>
        <li>
          <strong>Usuário cadastrado:</strong> acesse{" "}
          <Link href="/login">Entrar</Link> e vá em{" "}
          <Link href="/meus-dados">Meus dados</Link> para consultar informações, solicitar
          correção ou registrar pedidos formais.
        </li>
        <li>
          <strong>Sem cadastro no sistema:</strong> envie e-mail ao encarregado{" "}
          <a href={`mailto:${config.dpoEmail}`}>{config.dpoEmail}</a> identificando-se e
          descrevendo o pedido.
        </li>
      </ol>

      <h2>Prazo de resposta</h2>
      <p>
        As solicitações serão respondidas em prazo razoável, conforme art. 18, § 1º da
        LGPD, podendo ser prorrogado mediante justificativa ao titular.
      </p>

      <h2>Revogação do consentimento</h2>
      <p>
        Quando o tratamento se basear em consentimento, você pode revogá-lo a qualquer
        momento. A revogação não afeta tratamentos anteriores nem dados necessários para
        cumprimento de obrigação legal ou legítimo interesse (ex.: registros de empréstimo
        em andamento).
      </p>

      <h2>Autoridade nacional</h2>
      <p>
        Caso entenda que seus direitos não foram atendidos, você pode peticionar à
        Autoridade Nacional de Proteção de Dados (ANPD).
      </p>
    </LegalPageLayout>
  );
}
