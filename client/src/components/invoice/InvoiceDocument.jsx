import React from 'react';
import { convertNumberToWords, convertTaxToWords } from '../../utils/numberToWords';
import signatureImg from '../../assets/signature.png';
import logoIcon from '../../assets/logo-icon.png';

/**
 * Format date as DD-MM-YYYY to match the exact tax invoice layout
 */
function formatInvoiceDate(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return String(dateString);
  }
}

export default function InvoiceDocument({ invoice, id = 'tax-invoice-printable' }) {
  if (!invoice) return null;

  const company = invoice.companySnapshot || {
    companyName: 'GK Metal Testing Lab',
    address: {
      street: 'No.1, Parayadi Street, Sankaran Pillai Road',
      city: 'Trichy',
      state: 'Tamilnadu',
      stateCode: '33',
      pincode: '620 002'
    },
    gstin: '33CRZPV0007J1ZD',
    pan: 'CRZPV0007J',
    email: 'gkmetaltestinglab@gmail.com',
    bankDetails: {
      bankName: 'Karur Vysya Bank',
      accountName: 'GK Metal Testing Lab',
      accountNumber: '1195135000016609',
      branch: 'TRICHY MAIN BRANCH',
      ifscCode: 'KVBL0001195'
    }
  };

  const buyer = invoice.buyerSnapshot || {};
  const meta = invoice.metadata || {};
  const items = invoice.items || [];
  const billingAddr = buyer.billingAddress || buyer.address || {};

  const totalTaxAmount = Number(
    invoice.totalTax ||
    ((invoice.cgstAmount || 0) + (invoice.sgstAmount || 0) + (invoice.igstAmount || 0))
  );

  // Extract raw amount in words without duplicate "INR" prefix
  const rawWords = invoice.amountInWords || convertNumberToWords(invoice.grandTotal);
  const cleanAmountWords = rawWords.replace(/^INR\s+/i, '');

  // Format invoice number to ensure prefix is always present
  const prefix = company.invoicePrefix || company.invoiceConfig?.prefix || 'GK/INV/';
  const rawInvoiceNumber = String(invoice.invoiceNumber || '').trim();
  const displayInvoiceNumber = rawInvoiceNumber
    ? (rawInvoiceNumber.toLowerCase().startsWith(prefix.toLowerCase()) || rawInvoiceNumber.toLowerCase().startsWith('gk/')
        ? rawInvoiceNumber
        : `${prefix}${rawInvoiceNumber}`)
    : `${prefix}${invoice.financialYear || '26-27'}/${String(invoice.sequenceNumber || 1).padStart(3, '0')}`;

  return (
    <div
      id={id}
      className="invoice-document bg-white text-black leading-tight max-w-[760px] w-full mx-auto select-text p-3 print:p-0"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        color: '#000000'
      }}
    >
      {/* 1. Document Title Header */}
      <div className="relative text-center mb-1">
        <h1 className="text-[17px] font-bold tracking-wide uppercase text-black inline-block">
          TAX INVOICE
        </h1>
        <span className="absolute right-0 top-0.5 text-[11px] text-black">
          (Original for Recipient)
        </span>
      </div>

      {/* 2. Main Bordered Invoice Container */}
      <div className="border border-black">
        {/* Top Split Section: Left Company & Buyer, Right Metadata Table */}
        <div className="grid grid-cols-[1fr_320px]">
          {/* Left Column: Company Details & Buyer Details */}
          <div className="flex flex-col justify-between border-r border-black">
            {/* Company Info Box */}
            <div className="p-2 border-b border-black flex items-center gap-3">
              <div className="w-[78px] h-[78px] min-w-[78px] flex items-center justify-center shrink-0">
                <img src={logoIcon} alt="GK" className="w-full h-full object-contain" />
              </div>
              <div className="text-[11px] leading-[1.32] text-black">
                <div className="font-bold text-[13px] text-black mb-0.5">
                  {company.companyName || 'GK Metal Testing Lab'}
                </div>
                <div>{company.address?.street || 'No.1, Parayadi Street, Sankaran Pillai Road,'}</div>
                {company.address?.street && !company.address.street.includes('Sankaran Pillai') && (
                  <div>Sankaran Pillai Road,</div>
                )}
                <div>
                  {company.address?.city || 'Trichy'} – {company.address?.pincode || '620 002'}, {company.address?.state || 'Tamilnadu'}, India.
                </div>
                <div>
                  GSTIN : <strong className="font-bold">{company.gstin || '33CRZPV0007J1ZD'}</strong>
                </div>
                <div>
                  E-Mail: {company.email || 'gkmetaltestinglab@gmail.com'}
                </div>
              </div>
            </div>

            {/* Buyer Box */}
            <div className="p-2 text-[11px] leading-[1.32] text-black">
              <div className="text-[11px] text-black mb-0.5">Buyer</div>
              <div className="font-bold text-[12.5px] text-black">
                {buyer.companyName || '—'}
              </div>
              {billingAddr.street && <div className="whitespace-pre-line">{billingAddr.street}</div>}
              {(billingAddr.city || billingAddr.pincode) && (
                <div>
                  {billingAddr.city}
                  {billingAddr.pincode ? ` - ${billingAddr.pincode}` : ''}
                </div>
              )}
              {buyer.contactPerson && (
                <div>
                  Kind Attn : {buyer.contactPerson}
                </div>
              )}
              {buyer.phone && (
                <div>
                  Contact No: {buyer.phone}
                </div>
              )}
              {buyer.email && (
                <div>
                  Email : {buyer.email}
                </div>
              )}
              <div>
                GST: <strong className="font-bold">{buyer.gstin || '—'}</strong>
              </div>
              <div>
                State Name : {billingAddr.state || 'Tamilnadu'}, Code :{billingAddr.stateCode || '33'}.
              </div>
            </div>
          </div>

          {/* Right Column: Metadata Grid */}
          <div className="flex flex-col text-[10.5px]">
            {/* Row 1: Invoice No & Date */}
            <div className="grid grid-cols-2 border-b border-black min-h-[36px]">
              <div className="p-1 border-r border-black flex flex-col justify-between">
                <span className="text-black block text-[10.5px]">Invoice No.</span>
                <span className="font-bold text-[12px] text-black block mt-0.5">{displayInvoiceNumber}</span>
              </div>
              <div className="p-1 flex flex-col justify-between">
                <span className="text-black block text-[10.5px]">Date</span>
                <span className="font-bold text-[12px] text-black block mt-0.5">{formatInvoiceDate(invoice.invoiceDate)}</span>
              </div>
            </div>

            {/* Row 2: Delivery Note & Mode/Terms of Payment */}
            <div className="grid grid-cols-2 border-b border-black min-h-[36px]">
              <div className="p-1 border-r border-black flex flex-col justify-between">
                <span className="text-black block text-[10.5px]">Delivery Note</span>
                <span className="text-[11px] text-black block mt-0.5">{meta.deliveryNote || ''}</span>
              </div>
              <div className="p-1 flex flex-col justify-between">
                <span className="text-black block text-[10.5px]">Mode/Terms of Payment</span>
                <span className="text-[11px] text-black block mt-0.5">{meta.modeOfPayment || ''}</span>
              </div>
            </div>

            {/* Row 3: Supplier's Ref & Other Ref */}
            <div className="grid grid-cols-2 border-b border-black min-h-[36px]">
              <div className="p-1 border-r border-black flex flex-col justify-between">
                <span className="text-black block text-[10.5px]">Supplier&apos;s Ref.</span>
                <span className="text-[11px] text-black block mt-0.5">{meta.supplierRef || meta.testReportRef || ''}</span>
              </div>
              <div className="p-1 flex flex-col justify-between">
                <span className="text-black block text-[10.5px]">Other Reference(s)</span>
                <span className="text-[11px] text-black block mt-0.5">{meta.otherRef || ''}</span>
              </div>
            </div>

            {/* Row 4: Buyer's Order No & Dated */}
            <div className="grid grid-cols-2 border-b border-black min-h-[36px]">
              <div className="p-1 border-r border-black flex flex-col justify-between">
                <span className="text-black block text-[10.5px]">Buyer&apos;s Order No.:</span>
                <span className="text-[11px] text-black block mt-0.5">{meta.buyerOrderNo || ''}</span>
              </div>
              <div className="p-1 flex flex-col justify-between">
                <span className="text-black block text-[10.5px]">Dated.</span>
                <span className="text-[11px] text-black block mt-0.5">{meta.orderDate ? formatInvoiceDate(meta.orderDate) : ''}</span>
              </div>
            </div>

            {/* Row 5: Despatched through & Destination */}
            <div className="grid grid-cols-2 border-b border-black min-h-[36px]">
              <div className="p-1 border-r border-black flex flex-col justify-between">
                <span className="text-black block text-[10.5px]">Despatched through</span>
                <span className="text-[11px] text-black block mt-0.5">{meta.despatchedThrough || ''}</span>
              </div>
              <div className="p-1 flex flex-col justify-between">
                <span className="text-black block text-[10.5px]">Destination.</span>
                <span className="text-[11px] text-black block mt-0.5">{meta.destination || ''}</span>
              </div>
            </div>

            {/* Row 6: Terms of Delivery */}
            <div className="p-1 min-h-[36px] flex-1 flex flex-col justify-between">
              <span className="text-black block text-[10.5px]">Terms of Delivery</span>
              <span className="text-[11px] text-black block mt-0.5">{meta.termsOfDelivery || ''}</span>
            </div>
          </div>
        </div>

        {/* 3. Items Table Header */}
        <div className="grid grid-cols-[38px_1fr_65px_60px_60px_45px_90px] border-t border-b border-black text-center font-bold text-[11px] bg-white">
          <div className="py-1 border-r border-black flex items-center justify-center">Sl.<br/>No</div>
          <div className="py-1 px-2 border-r border-black flex items-center justify-center">Description of Services</div>
          <div className="py-1 border-r border-black flex items-center justify-center">HSN/SAC</div>
          <div className="py-1 border-r border-black flex items-center justify-center">Quantity</div>
          <div className="py-1 border-r border-black flex items-center justify-center">Rate</div>
          <div className="py-1 border-r border-black flex items-center justify-center">Per</div>
          <div className="py-1 px-2 flex items-center justify-center">Amount</div>
        </div>

        {/* 4. Items Table Body (continuous vertical divider lines) */}
        <div className="grid grid-cols-[38px_1fr_65px_60px_60px_45px_90px] min-h-[310px] text-[11px] text-black">
          {/* Sl No Col */}
          <div className="border-r border-black p-1 text-center font-normal">
            {items.map((item, idx) => (
              <div key={idx} className="py-0.5">{item.slNo || `${idx + 1}.`}</div>
            ))}
          </div>

          {/* Description Col */}
          <div className="border-r border-black p-1.5 flex flex-col justify-between">
            <div className="space-y-1">
              {items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold text-[11.5px] text-black uppercase">{item.description}</div>
                  {(item.testedDate || item.testedOn) && (
                    <div className="text-[11px] text-black">
                      Tested on : {formatInvoiceDate(item.testedDate || item.testedOn)}
                    </div>
                  )}
                  {(item.dayType || item.visitType) && (
                    <div className="text-[11px] text-black">
                      ({item.dayType || item.visitType})
                    </div>
                  )}
                  {item.testingSite && <div className="text-[11px] text-black">Site of Testing : {item.testingSite}</div>}
                  {item.sampleDetails && <div className="text-[11px] text-black">{item.sampleDetails}</div>}
                  {item.notes && <div className="text-[11px] text-black">{item.notes}</div>}
                  {item.discountPercent > 0 && (
                    <div className="text-[10px] text-black">Less Discount @ {item.discountPercent}%</div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom within Description Column: Tax lines right aligned */}
            <div className="pt-4 flex justify-end">
              <div className="text-right text-[11px] font-normal space-y-0.5 pr-2">
                {!invoice.isInterstate ? (
                  <>
                    <div>Output CGST {invoice.cgstRate || 9}%</div>
                    <div>Output SGST {invoice.sgstRate || 9}%</div>
                  </>
                ) : (
                  <div>Output IGST {invoice.igstRate || 18}%</div>
                )}
              </div>
            </div>
          </div>

          {/* HSN/SAC Col */}
          <div className="border-r border-black p-1 text-center">
            {items.map((item, idx) => (
              <div key={idx} className="py-0.5">{item.hsnSac || '998346'}</div>
            ))}
          </div>

          {/* Quantity Col */}
          <div className="border-r border-black p-1 text-center">
            {items.map((item, idx) => (
              <div key={idx} className="py-0.5">{item.quantity}</div>
            ))}
          </div>

          {/* Rate Col */}
          <div className="border-r border-black p-1 text-center">
            {items.map((item, idx) => (
              <div key={idx} className="py-0.5">{Number(item.rate).toFixed(0)}</div>
            ))}
          </div>

          {/* Per Col */}
          <div className="border-r border-black p-1 text-center">
            {items.map((item, idx) => (
              <div key={idx} className="py-0.5">{item.per || 'No.'}</div>
            ))}
          </div>

          {/* Amount Col */}
          <div className="p-1.5 text-right flex flex-col justify-between">
            <div className="space-y-0.5">
              {items.map((item, idx) => (
                <div key={idx}>
                  {Number(item.taxableAmount || item.quantity * item.rate).toFixed(2)}
                </div>
              ))}
            </div>

            {/* Tax values aligned with CGST / SGST */}
            <div className="space-y-0.5">
              {!invoice.isInterstate ? (
                <>
                  <div>{Number(invoice.cgstAmount || (totalTaxAmount / 2)).toFixed(2)}</div>
                  <div>{Number(invoice.sgstAmount || (totalTaxAmount / 2)).toFixed(2)}</div>
                </>
              ) : (
                <div>{Number(invoice.igstAmount || totalTaxAmount).toFixed(2)}</div>
              )}
            </div>
          </div>
        </div>

        {/* 5. Total Row */}
        <div className="grid grid-cols-[38px_1fr_65px_60px_60px_45px_90px] border-t border-b border-black text-[11px]">
          <div className="border-r border-black"></div>
          <div className="border-r border-black py-0.5 text-center font-normal">Total</div>
          <div className="border-r border-black"></div>
          <div className="border-r border-black"></div>
          <div className="border-r border-black"></div>
          <div className="border-r border-black"></div>
          <div className="py-0.5 px-1.5 text-right font-bold text-[11.5px]">
            {Number(invoice.grandTotal || 0).toFixed(2)}
          </div>
        </div>

        {/* 6. Amount Chargeable In Words */}
        <div className="border-b border-black px-1.5 py-1 text-[11px]">
          <div className="flex justify-between items-center text-black">
            <span>Amount Chargeable (in words)</span>
            <span className="text-black text-[11px]">E. & O.E</span>
          </div>
          <div className="text-[11.5px] text-black mt-0.5">
            INR <strong className="font-bold">{cleanAmountWords}</strong>
          </div>
        </div>

        {/* 7. Tax Amount In Words */}
        <div className="px-1.5 pt-1.5 pb-1 text-[11px] text-black">
          Tax Amount (in Words) <strong className="font-bold">{convertTaxToWords(totalTaxAmount)}</strong>
        </div>

        {/* 8. Bottom Section: PAN, Declaration, Bank Details & Signatory */}
        <div className="grid grid-cols-[1fr_320px]">
          {/* Left Sub-Section: PAN (top) + Declaration (bottom) */}
          <div className="px-2 pb-2 flex flex-col justify-between">
            <div className="mt-2.5">
              <div className="font-bold text-[11.5px] text-black">
                Company&apos;s PAN : {company.pan || 'CRZPV0007J'}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[11px] font-bold text-black mb-1">
                Declaration:
              </div>
              {invoice.declaration ? (
                <div className="text-[9.5px] text-black leading-[1.35] space-y-0.5 whitespace-pre-line">
                  {invoice.declaration}
                </div>
              ) : (
                <div className="text-[9.5px] text-black leading-[1.35] space-y-0.5">
                  <p>1) Cheque, DD / RTGS in favour of <strong>GK Metal Testing Lab</strong> Payable at Trichy.</p>
                  <p>2) GST category: (998346) technical testing and analysis service.</p>
                  <p>3) We hereby declare that, there is no transfer of property in goods involved in execution of this contract which is leviable to tax as sale of goods. <strong>“This is purely a service contract.”</strong></p>
                  <p>4) All disputes Subject to Chennai Jurisdiction.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sub-Section: Bank Details + Signatory */}
          <div className="flex flex-col justify-between">
            {/* Bank Details */}
            <div className="p-2 text-[10.5px]">
              <div className="font-bold text-[11px] text-black mb-1">Company&apos;s Bank Details :</div>
              <div className="grid grid-cols-[98px_1fr] text-[10.5px] leading-[1.35] text-black">
                <span>Name of the Bank</span>
                <span>: <strong>{company.bankDetails?.bankName || 'Karur Vysya Bank'}</strong></span>
                <span>Account No.</span>
                <span>: <strong>{company.bankDetails?.accountNumber || '1195135000016609'}</strong></span>
                <span>Branch</span>
                <span>: <strong>{company.bankDetails?.branch || 'TRICHY MAIN BRANCH'}</strong></span>
                <span>IFSC Code</span>
                <span>: <strong>{company.bankDetails?.ifscCode || 'KVBL0001195'}</strong></span>
              </div>
            </div>

            {/* Authorised Signatory Box */}
            <div className="border-t border-l border-black px-2.5 py-1.5 flex flex-col justify-between h-[90px] text-right bg-white relative overflow-hidden">
              <div className="font-bold text-[11px] text-black relative z-10">
                For {company.companyName || 'GK Metal Testing Lab'}
              </div>
              <div className="absolute inset-0 flex items-center justify-start pl-6 pointer-events-none">
                <img
                  src={company.signatureUrl || signatureImg}
                  alt="Authorised Signatory"
                  className="h-[70px] w-auto max-w-[175px] object-contain"
                />
              </div>
              <div className="font-bold text-[11px] text-black relative z-10">
                Authorised Signatory
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 8. Footer Bar */}
      <div className="text-center py-1 text-[11px] font-bold text-black mt-1">
        This is a Computer Generated Invoice
      </div>
    </div>
  );
}
