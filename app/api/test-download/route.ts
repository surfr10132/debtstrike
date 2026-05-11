import { NextResponse } from 'next/server';
import { generateDocx } from '@/lib/generate-docx';
import { generatePdf } from '@/lib/generate-pdf';
import { SessionPayload } from '@/lib/types';

// TEST ONLY — bypasses Stripe, remove before going live
export async function POST(request: Request) {
  // SECURITY: Disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test download endpoint is disabled in production.' },
      { status: 403 }
    );
  }

  try {
    const { format } = (await request.json()) as { format: 'docx' | 'pdf' };

    if (!format || (format !== 'docx' && format !== 'pdf')) {
      return NextResponse.json(
        { error: 'Invalid format. Must be docx or pdf.' },
        { status: 400 }
      );
    }

    const testPayload: SessionPayload = {
      extractedData: {
        collectorName: 'Midland Credit Management, Inc.',
        collectorAddress: '350 Camino de la Reina, Suite 100\nSan Diego, CA 92108',
        accountNumber: '4831-XXXX-XXXX-7892',
        amountClaimed: '$3,247.56',
        originalCreditor: 'Capital One Bank, N.A.',
        isThirdPartyCollector: true,
        collectorTypeConfidence: 'high',
        recipientName: 'John Smith',
        recipientStreetAddress: '123 Main Street',
        recipientCity: 'Los Angeles',
        recipientState: 'CA',
        recipientZip: '90012',
        recipientPhone: '(213) 555-1234',
      },
      userInfo: {
        fullName: 'John Smith',
        streetAddress: '123 Main Street',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        phone: '(310) 555-1234',
        ssnLast4: '5678',
        dob: '1985-03-15',
      },
      generatedLetter: {
        letterText: `John Smith
123 Main Street
Los Angeles, CA 90001
(310) 555-1234

March 13, 2026

Midland Credit Management, Inc.
350 Camino de la Reina, Suite 100
San Diego, CA 92108

RE: Account Number 4831-XXXX-XXXX-7892 - Demand for Debt Validation and Cease & Desist Notice

Dear Sir or Madam:

This letter serves as my formal response to your recent communication regarding the above-referenced account. I am exercising my statutory rights under the Fair Debt Collection Practices Act, 15 U.S.C. § 1692 et seq., and the California Rosenthal Fair Debt Collection Practices Act, Cal. Civ. Code § 1788 et seq.

I hereby dispute this alleged debt in its entirety and invoke my right to validation pursuant to 15 U.S.C. § 1692g. Before proceeding with any collection efforts, you must provide complete verification of this claimed obligation.

Specifically, I require the following documentation:

1. Current licensing documentation proving your authorization to collect debts in California
2. The complete name and last known address of the original creditor, Capital One Bank, N.A.
3. Legal proof that you own this debt or possess valid authorization to collect it
4. A comprehensive payment history detailing how the claimed amount of $3,247.56 was calculated
5. A legible copy of the original signed credit agreement or contract
6. The exact date of the last payment made on this account, if any

Additionally, I am invoking my right under 15 U.S.C. § 1692c(c) to cease all communications except as specifically permitted by law. Effective immediately, you are directed to cease all telephone contact with me.

Should you fail to provide adequate validation within thirty days, you must cease all collection activities related to this account and remove any adverse credit reporting, as required under California Civil Code § 1788.14.

I reserve all rights under applicable consumer protection laws.

Sincerely,


John Smith`,
        date: 'March 13, 2026',
      },
    };

    if (format === 'docx') {
      const buffer = await generateDocx(testPayload);
      if (!buffer || buffer.length === 0) {
        console.error('DOCX generation returned empty buffer in test endpoint');
        return NextResponse.json(
          { error: 'Failed to generate test document - empty content.' },
          { status: 500 }
        );
      }
      return new NextResponse(Buffer.from(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="DebtStrike-Test.docx"',
        },
      });
    } else {
      const pdfBytes = await generatePdf(testPayload);
      if (!pdfBytes || pdfBytes.length === 0) {
        console.error('PDF generation returned empty buffer in test endpoint');
        return NextResponse.json(
          { error: 'Failed to generate test document - empty content.' },
          { status: 500 }
        );
      }
      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="DebtStrike-Test.pdf"',
        },
      });
    }
  } catch (error) {
    console.error('Test download error:', error);
    return NextResponse.json(
      { error: `Failed: ${error}` },
      { status: 500 }
    );
  }
}
