import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { getLegalConfig } from "@/lib/lgpd";

export const metadata = {
  title: "Política de Privacidade — Biblioteca",
};

export const dynamic = "force-dynamic";

export default async function PrivacidadePage() {
  const config = await getLegalConfig();
  const dpoContact = config.dpoName
    ? `${config.dpoName} (${config.dpoEmail})`
    : config.dpoEmail;

  return (
    <LegalPageLayout
      title="Política de Privacidade"
      version={config.privacyPolicyVersion}
      updatedAt="03/07/2026"
      config={config}
    >
      <h2>1. Controlador dos dados</h2>
      <p>
        O controlador dos dados pessoais tratados neste sistema é{" "}
        <strong>{config.institutionName}</strong>
        {config.institutionAddress ? `, com endereço em ${config.institutionAddress}` : ""},
        contato:{" "}
        <a href={`mailto:${config.institutionEmail}`}>{config.institutionEmail}</a>.
      </p>

      <h2>2. Encarregado de dados (DPO)</h2>
      <p>
        Para questões relacionadas à proteção de dados pessoais, entre em contato com o
        encarregado: <a href={`mailto:${config.dpoEmail}`}>{dpoContact}</a>.
      </p>

      <h2>3. Dados pessoais tratados</h2>
      <ul>
        <li>
          <strong>Leitores cadastrados:</strong> nome, e-mail, CPF (opcional), senha
          (armazenada de forma criptografada) e histórico de empréstimos.
        </li>
        <li>
          <strong>Bibliotecários (administradores):</strong> nome, e-mail e senha
          criptografada.
        </li>
        <li>
          <strong>Visitantes do catálogo público:</strong> não é exigido cadastro; o
          assistente de busca processa mensagens apenas para responder à consulta, sem
          armazenamento permanente do conteúdo.
        </li>
      </ul>

      <h2>4. Finalidades e bases legais (LGPD)</h2>
      <ul>
        <li>
          <strong>Gestão de empréstimos e devoluções</strong> — execução de procedimentos
          preliminares relacionados a contrato ou a pedido do titular (art. 7º, V) e
          legítimo interesse da biblioteca (art. 7º, IX).
        </li>
        <li>
          <strong>Identificação do leitor (CPF)</strong> — quando informado, para evitar
          duplicidade de cadastro e vincular empréstimos ao titular correto, com base no
          legítimo interesse (art. 7º, IX) e consentimento registrado no cadastro (art.
          7º, I).
        </li>
        <li>
          <strong>Autenticação no sistema</strong> — execução de contrato/prestação do
          serviço da biblioteca (art. 7º, V).
        </li>
        <li>
          <strong>Cumprimento de obrigações legais</strong> — quando aplicável (art. 7º,
          II).
        </li>
      </ul>

      <h2>5. Compartilhamento de dados</h2>
      <p>
        Os dados não são vendidos nem compartilhados com terceiros para fins de marketing.
        O armazenamento pode utilizar provedores de infraestrutura (hospedagem e banco de
        dados), que atuam como operadores sob contrato e medidas de segurança adequadas.
      </p>

      <h2>6. Retenção</h2>
      <p>
        Os dados são mantidos enquanto durar o vínculo do leitor com a biblioteca e pelo
        prazo necessário para cumprimento de obrigações legais, resolução de disputas e
        exercício regular de direitos. Após solicitação de eliminação, os dados podem ser
        anonimizados ou excluídos, respeitadas obrigações legais de guarda de registros de
        empréstimo.
      </p>

      <h2>7. Direitos do titular</h2>
      <p>
        Nos termos dos arts. 17 a 22 da LGPD, você pode solicitar: confirmação de
        tratamento, acesso, correção, anonimização, bloqueio, eliminação, portabilidade,
        informação sobre compartilhamentos e revogação do consentimento.
      </p>
      <p>
        Usuários autenticados podem exercer parte desses direitos em{" "}
        <a href="/meus-dados">Meus dados</a>. Demais solicitações:{" "}
        <a href={`mailto:${config.dpoEmail}`}>{config.dpoEmail}</a> ou página{" "}
        <a href="/lgpd">Seus direitos (LGPD)</a>.
      </p>

      <h2>8. Segurança</h2>
      <p>
        Adotamos medidas técnicas e administrativas, incluindo senhas criptografadas,
        controle de acesso por perfil (bibliotecário/leitor), comunicação HTTPS em
        produção e minimização da exibição de dados sensíveis (ex.: CPF mascarado).
      </p>

      <h2>9. Alterações desta política</h2>
      <p>
        Alterações relevantes serão comunicadas e poderão exigir novo aceite na próxima
        autenticação. A versão vigente é {config.privacyPolicyVersion}.
      </p>
    </LegalPageLayout>
  );
}
