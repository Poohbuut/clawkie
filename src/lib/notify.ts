import { esc, layout, sendEmail } from './email';

function ownerEmail() {
  const email = process.env.OWNER_EMAIL;
  if (!email) console.warn('Owner notification skipped: OWNER_EMAIL not set');
  return email;
}

export async function notifyAppointmentCreated(appointment: {
  customerName: string;
  customerEmail: string;
  phone: string;
  serviceName: string;
  designName: string | null;
  date: string;
  time: string;
  notes: string;
  photoUrl: string | null;
}) {
  const to = ownerEmail();
  if (!to) return;

  const photo = appointment.photoUrl
    ? `<p><a href="${esc(appointment.photoUrl)}">View inspiration photo</a></p>`
    : '';
  await sendEmail({
    to,
    replyTo: appointment.customerEmail,
    subject: `New nail appointment request: ${appointment.customerName}`,
    html: layout(`
      <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:500;">New nail appointment</h1>
      <p><strong>Customer:</strong> ${esc(appointment.customerName)}</p>
      <p><strong>Email:</strong> ${esc(appointment.customerEmail)}</p>
      <p><strong>Phone:</strong> ${esc(appointment.phone)}</p>
      <p><strong>Service:</strong> ${esc(appointment.serviceName)}</p>
      <p><strong>Design:</strong> ${esc(appointment.designName || 'No design selected')}</p>
      <p><strong>Date and time:</strong> ${esc(appointment.date)} at ${esc(appointment.time)}</p>
      <p><strong>Notes:</strong> ${esc(appointment.notes || 'None')}</p>
      ${photo}
    `),
  });
}

export async function notifyCookieOrderCreated(order: {
  customerName: string;
  customerEmail: string;
  phone: string;
  date: string;
  time: string;
  fulfillment: string;
  address: string | null;
  allergies: string | null;
  notes: string | null;
  items: { name: string; quantity: number; price: number }[];
  total: number;
}) {
  const to = ownerEmail();
  if (!to) return;

  const items = order.items.map((item) =>
    `<li>${item.quantity} × ${esc(item.name)} — ${esc((item.price * item.quantity).toFixed(2))}</li>`,
  ).join('');
  await sendEmail({
    to,
    replyTo: order.customerEmail,
    subject: `New cookie order: ${order.customerName}`,
    html: layout(`
      <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:500;">New cookie order</h1>
      <p><strong>Customer:</strong> ${esc(order.customerName)}</p>
      <p><strong>Email:</strong> ${esc(order.customerEmail)}</p>
      <p><strong>Phone:</strong> ${esc(order.phone)}</p>
      <p><strong>Fulfillment:</strong> ${esc(order.fulfillment)} on ${esc(order.date)} at ${esc(order.time)}</p>
      ${order.address ? `<p><strong>Address:</strong> ${esc(order.address)}</p>` : ''}
      <p><strong>Allergies:</strong> ${esc(order.allergies || 'None')}</p>
      <p><strong>Notes:</strong> ${esc(order.notes || 'None')}</p>
      <ul>${items}</ul>
      <p><strong>Total:</strong> ${esc(order.total.toFixed(2))}</p>
    `),
  });
}