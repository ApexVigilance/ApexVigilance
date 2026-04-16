
export interface EmailAttachment {
  filename: string;
  contentBase64: string;
  contentType: string;
}

export interface EmailPayload {
  to: string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export const sendIncidentEmail = async (payload: EmailPayload): Promise<{ ok: boolean; messageId?: string }> => {
  // Assuming local server for dev, or relative path in production
  // Using type assertion to bypass strict TS check on import.meta.env
  const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${API_URL}/api/email/incident`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `Server Error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Email Service Error:", error);
    throw error;
  }
};
