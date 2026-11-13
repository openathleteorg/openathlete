import { EmailLanguage, emailLibrary } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { EmailTransportService } from './email-transport.service';
import { NotificationService } from './notification.service';

function setup(account: { language: EmailLanguage } | null) {
  const transport = { isEnabled: () => true, send: jest.fn() };
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(account) },
  };
  const service = new NotificationService(
    transport as unknown as EmailTransportService,
    prisma as unknown as PrismaService,
  );
  const sendInvitation = (language?: EmailLanguage) =>
    service.sendEmail({
      type: 'athlete-invitation',
      to: 'new@example.com',
      params: { coachName: 'Ana Lopez', url: 'http://localhost/invite' },
      language,
    });
  const sent = () =>
    transport.send.mock.calls[0][0] as { subject: string; html: string };
  return { sendInvitation, sent };
}

const subjects = emailLibrary['athlete-invitation'].defaultSubject;

describe('NotificationService.sendEmail language', () => {
  it("writes in the recipient's saved language", async () => {
    const { sendInvitation, sent } = setup({ language: 'IT' });
    await sendInvitation('ES');
    expect(sent().subject).toBe(subjects.IT);
    expect(sent().html).toContain('<html lang="it">');
  });

  it('writes in Brazilian Portuguese for a PT_BR recipient', async () => {
    const { sendInvitation, sent } = setup({ language: 'PT_BR' });
    await sendInvitation();
    expect(sent().subject).toBe(subjects.PT_BR);
    expect(sent().html).toContain('<html lang="pt-BR">');
  });

  it('writes in German for a DE recipient', async () => {
    const { sendInvitation, sent } = setup({ language: 'DE' });
    await sendInvitation();
    expect(sent().subject).toBe(subjects.DE);
    expect(sent().html).toContain('<html lang="de">');
  });

  it("uses the payload's language when the recipient has no account", async () => {
    const { sendInvitation, sent } = setup(null);
    await sendInvitation('ES');
    expect(sent().subject).toBe(subjects.ES);
    expect(sent().html).toContain('<html lang="es">');
  });

  it('falls back to French without either', async () => {
    const { sendInvitation, sent } = setup(null);
    await sendInvitation();
    expect(sent().subject).toBe(subjects.FR);
    expect(sent().html).toContain('<html lang="fr">');
  });
});
