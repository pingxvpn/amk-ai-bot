export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto p-8 font-sans text-slate-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy for AMK AI</h1>
      <p className="mb-4 text-sm text-slate-500">Last updated: September 2026</p>
      <p className="mb-4">
        AMK AI provides automated AI customer support and sales services for Facebook Pages. We respect your privacy and only access necessary Facebook Page data (messages and page metadata) to provide automated responses.
      </p>
      <h2 className="text-xl font-bold mt-6 mb-2">Data We Collect</h2>
      <p className="mb-4">
        We only process incoming customer messages to generate AI replies. We do not sell or share personal data with third parties.
      </p>
      <h2 className="text-xl font-bold mt-6 mb-2">Contact Us</h2>
      <p>If you have any questions, contact us at: support@amk-ai-bot.vercel.app</p>
    </div>
  );
}