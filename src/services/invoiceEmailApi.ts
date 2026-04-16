export interface SmtpPayload {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export interface InvoiceEmailPayload {
  to: string[];
  subject: string;
  html: string;
  smtp?: SmtpPayload;
  attachments?: {
    filename: string;
    contentBase64: string;
    contentType: string;
  }[];
}

export interface InvoiceEmailResponse {
  ok: boolean;
  messageId?: string;
}

export const sendInvoiceEmail = async (payload: InvoiceEmailPayload): Promise<InvoiceEmailResponse> => {
  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

  // Lees SMTP config uit localStorage (opgeslagen via Instellingen)
  let smtp: SmtpPayload | undefined;
  try {
    const stored = localStorage.getItem('apex_billing_config_v2');
    if (stored) {
      const config = JSON.parse(stored);
      if (config.smtp?.host && config.smtp?.user && config.smtp?.pass) {
        smtp = config.smtp;
      }
    }
  } catch (_) {}

  const response = await fetch(`${apiUrl}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, smtp }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || 'Fout bij het versturen van de email');
  }

  const data = await response.json().catch(() => ({}));
  return { ok: true, messageId: data?.messageId };
};
