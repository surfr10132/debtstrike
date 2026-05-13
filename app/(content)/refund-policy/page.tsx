import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy | DebtStrike',
  description: 'Our refund policy for debt validation and cease & desist letters.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Refund Policy</h1>
          <p className="text-slate-400">Last updated: March 14, 2026</p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Overview */}
          <section className="border-l-4 border-orange-500 pl-6 py-2">
            <h2 className="text-xl font-semibold text-white mb-3">Digital Product Policy</h2>
            <p className="text-slate-300 leading-relaxed">
              DebtStrike letters are custom-generated digital products delivered immediately upon payment. Because these letters are unique, non-returnable goods created on-demand, <strong>refunds are generally not available</strong>. However, we stand behind our service and offer refunds in specific technical failure scenarios.
            </p>
          </section>

          {/* Refund Eligible */}
          <section className="border-l-4 border-green-600 pl-6 py-2">
            <h2 className="text-xl font-semibold text-white mb-3">When We Offer Refunds</h2>
            <p className="text-slate-300 mb-3">Refunds are available if:</p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span>Your generated letter is empty, corrupted, or cannot be downloaded</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span>Our system fails to generate a letter at all</span>
              </li>
            </ul>
          </section>

          {/* Not Refundable */}
          <section className="border-l-4 border-red-700 pl-6 py-2">
            <h2 className="text-xl font-semibold text-white mb-3">What We Don't Refund</h2>
            <p className="text-slate-300 mb-3">No refunds for:</p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-red-600 font-bold mt-0.5">✕</span>
                <span>Change of mind or dissatisfaction with content</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-600 font-bold mt-0.5">✕</span>
                <span>Failure to send the letter to the creditor</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-600 font-bold mt-0.5">✕</span>
                <span>Collector's response or lack thereof</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-600 font-bold mt-0.5">✕</span>
                <span>Any outcomes beyond our control</span>
              </li>
            </ul>
          </section>

          {/* How to Request */}
          <section className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-3">How to Request a Refund</h2>
            <div className="space-y-2 text-slate-300">
              <p>
                <strong>Timeline:</strong> Refund requests must be submitted within 48 hours of purchase.
              </p>
              <p>
                <strong>Process:</strong> Email <span className="font-mono text-orange-400">support@debtstrike.io</span> with your order details and description of the technical issue.
              </p>
              <p className="text-sm text-slate-400 mt-4">
                We'll review your request and process approved refunds within 5 business days.
              </p>
            </div>
          </section>

          {/* Footer Note */}
          <p className="text-slate-400 text-sm italic pt-4">
            Questions? Contact support@debtstrike.io
          </p>
        </div>
      </div>
    </div>
  );
}
