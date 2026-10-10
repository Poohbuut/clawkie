export default function CustomerFields({ ring }: { ring: string }) {
  const input = `field-input ${ring}`;
  return (
    <>
      <div className="mb-4">
        <label htmlFor="full_name" className="field-label">Your name</label>
        <input id="full_name" name="full_name" type="text" required className={input} />
      </div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input id="email" name="email" type="email" required className={input} />
        </div>
        <div>
          <label htmlFor="phone" className="field-label">Phone</label>
          <input id="phone" name="phone" type="tel" required className={input} />
        </div>
      </div>
    </>
  );
}