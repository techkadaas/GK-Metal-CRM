import React from 'react';
import { formatDate } from '../../utils/formatters';
import { convertNumberToWords, convertTaxToWords } from '../../utils/numberToWords';
import signatureImg from '../../assets/signature.png';
import logoIcon from '../../assets/logo-icon.png';

export default function InvoiceDocument({ invoice, id = 'tax-invoice-printable' }) {
  if (!invoice) return null;

  const company = invoice.companySnapshot || {
    companyName: 'GK Metal Testing Lab',
    address: {
      street: 'No.1, Paruvathi Street, Sankaran Pillai Road',
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

  return (
    <div
      id={id}
      className="invoice-document bg-white text-black text-[10px] font-sans leading-tight max-w-[800px] mx-auto select-text p-4 print:p-2"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      {/* 1. Document Title Header */}
      <div className="relative text-center mb-1">
        <h1 className="text-base font-black tracking-wider uppercase text-black inline-block">
          TAX INVOICE
        </h1>
        <span className="absolute right-0 top-0.5 text-[8.5px] text-slate-700 font-medium">
          (Original for Recipient)
        </span>
      </div>

      {/* 2. Main Bordered Invoice Container */}
      <div className="border-[1.5px] border-black">
        {/* Top Split Section: Left Company & Buyer, Right Metadata */}
        <div className="grid grid-cols-12 border-b-[1.5px] border-black">
          {/* Left Column (7 cols): Company Details & Buyer Details */}
          <div className="col-span-7 border-r-[1.5px] border-black flex flex-col justify-between">
            {/* Company Info Box */}
            <div className="p-2 border-b-[1.5px] border-black flex items-center gap-3">
              <div className="w-28 h-28 min-w-[105px] flex items-center justify-center shrink-0">
                <img src={logoIcon} alt="GK" className="w-full h-full object-contain" />
              </div>
              <div className="text-[9.5px] leading-[1.35] text-black">
                <div className="font-bold text-xs text-black mb-0.5">
                  {company.companyName || 'GK Metal Testing Lab'}
                </div>
                <div>{company.address?.street || 'No.1, Paruvathi Street, Sankaran Pillai Road,'}</div>
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
            <div className="p-2 text-[9.5px] leading-[1.35] text-black">
              <div className="text-[9px] text-slate-700 mb-0.5">Buyer</div>
              <div className="font-bold text-[11px] text-black">
                {buyer.companyName || '—'}
              </div>
              {billingAddr.street && <div>{billingAddr.street}</div>}
              {(billingAddr.city || billingAddr.pincode) && (
                <div>
                  {billingAddr.city}
                  {billingAddr.pincode ? ` - ${billingAddr.pincode}` : ''}
                </div>
              )}
              {buyer.contactPerson && (
                <div>
                  Kind Attn : <span className="font-medium">{buyer.contactPerson}</span>
                </div>
              )}
              {buyer.phone && (
                <div>
                  Contact No: <span className="font-medium">{buyer.phone}</span>
                </div>
              )}
              {buyer.email && (
                <div>
                  Email : <span className="font-medium">{buyer.email}</span>
                </div>
              )}
              <div>
                GST : <strong className="font-bold">{buyer.gstin || '—'}</strong>
              </div>
              <div>
                State Name : {billingAddr.state || 'Tamilnadu'}, Code : {billingAddr.stateCode || '33'}.
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Metadata Grid */}
          <div className="col-span-5 flex flex-col divide-y-[1.5px] divide-black text-[9px]">
            {/* Row 1: Invoice No & Dated */}
            <div className="grid grid-cols-2 divide-x-[1.5px] divide-black min-h-[36px]">
              <div className="p-1.5">
                <span className="text-slate-600 block text-[8.5px]">Invoice No.</span>
                <span className="font-bold text-xs text-black block mt-0.5">{invoice.invoiceNumber}</span>
              </div>
              <div className="p-1.5">
                <span className="text-slate-600 block text-[8.5px]">Dated</span>
                <span className="font-bold text-[11px] text-black block mt-0.5">{formatDate(invoice.invoiceDate)}</span>
              </div>
            </div>

            {/* Row 2: Delivery Note & Mode/Terms of Payment */}
            <div className="grid grid-cols-2 divide-x-[1.5px] divide-black min-h-[36px]">
              <div className="p-1.5">
                <span className="text-slate-600 block text-[8.5px]">Delivery Note</span>
                <span className="font-medium text-[9.5px] text-black block mt-0.5">{meta.deliveryNote || ''}</span>
              </div>
              <div className="p-1.5">
                <span className="text-slate-600 block text-[8.5px]">Mode/Terms of Payment</span>
                <span className="font-bold text-[9.5px] text-black block mt-0.5">{meta.modeOfPayment || '30 Days'}</span>
              </div>
            </div>

            {/* Row 3: Supplier's Ref & Other Ref */}
            <div className="grid grid-cols-2 divide-x-[1.5px] divide-black min-h-[36px]">
              <div className="p-1.5">
                <span className="text-slate-600 block text-[8.5px]">Supplier&apos;s Ref.</span>
                <span className="font-medium text-[9.5px] text-black block mt-0.5">{meta.supplierRef || meta.testReportRef || ''}</span>
              </div>
              <div className="p-1.5">
                <span className="text-slate-600 block text-[8.5px]">Other Reference(s)</span>
                <span className="font-medium text-[9.5px] text-black block mt-0.5">{meta.otherRef || ''}</span>
              </div>
            </div>

            {/* Row 4: Buyer's Order No & Dated */}
            <div className="grid grid-cols-2 divide-x-[1.5px] divide-black min-h-[36px]">
              <div className="p-1.5">
                <span className="text-slate-600 block text-[8.5px]">Buyer&apos;s Order No.</span>
                <span className="font-medium text-[9.5px] text-black block mt-0.5">{meta.buyerOrderNo || ''}</span>
              </div>
              <div className="p-1.5">
                <span className="text-slate-600 block text-[8.5px]">Dated</span>
                <span className="font-medium text-[9.5px] text-black block mt-0.5">{meta.orderDate ? formatDate(meta.orderDate) : ''}</span>
              </div>
            </div>

            {/* Row 5: Despatched through & Destination */}
            <div className="grid grid-cols-2 divide-x-[1.5px] divide-black min-h-[36px]">
              <div className="p-1.5">
                <span className="text-slate-600 block text-[8.5px]">Despatched through</span>
                <span className="font-medium text-[9.5px] text-black block mt-0.5">{meta.despatchedThrough || ''}</span>
              </div>
              <div className="p-1.5">
                <span className="text-slate-600 block text-[8.5px]">Destination</span>
                <span className="font-medium text-[9.5px] text-black block mt-0.5">{meta.destination || ''}</span>
              </div>
            </div>

            {/* Row 6: Terms of Delivery */}
            <div className="p-1.5 min-h-[36px]">
              <span className="text-slate-600 block text-[8.5px]">Terms of Delivery</span>
              <span className="font-medium text-[9.5px] text-black block mt-0.5">{meta.termsOfDelivery || ''}</span>
            </div>
          </div>
        </div>

        {/* 3. Items Table Header */}
        <div className="grid grid-cols-[40px_1fr_70px_60px_65px_45px_90px] border-b-[1.5px] border-black text-center font-bold text-[9.5px] bg-white">
          <div className="py-1.5 border-r-[1.5px] border-black">Sl.<br/>No</div>
          <div className="py-1.5 px-2 border-r-[1.5px] border-black text-center">Description of Services</div>
          <div className="py-1.5 border-r-[1.5px] border-black">HSN/SAC</div>
          <div className="py-1.5 border-r-[1.5px] border-black">Quantity</div>
          <div className="py-1.5 border-r-[1.5px] border-black">Rate</div>
          <div className="py-1.5 border-r-[1.5px] border-black">Per</div>
          <div className="py-1.5 px-2 text-right">Amount</div>
        </div>

        {/* 4. Items Table Body (with continuous vertical divider lines) */}
        <div className="grid grid-cols-[40px_1fr_70px_60px_65px_45px_90px] min-h-[220px] text-[9.5px] text-black">
          {/* Sl No Col */}
          <div className="border-r-[1.5px] border-black p-1 text-center font-medium">
            {items.map((item, idx) => (
              <div key={idx} className="py-0.5">{item.slNo || `${idx + 1}.`}</div>
            ))}
          </div>

          {/* Description Col */}
          <div className="border-r-[1.5px] border-black p-1.5 flex flex-col justify-between">
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx}>
                  <div className="font-bold text-[10px] text-black uppercase">{item.description}</div>
                  {item.testedDate && <div className="text-[9px] text-slate-800">Tested on {formatDate(item.testedDate)}</div>}
                  {item.visitType && <div className="text-[9px] text-slate-800">({item.visitType})</div>}
                  {item.testingSite && <div className="text-[9px] text-slate-800">Site of Testing : {item.testingSite}</div>}
                  {item.sampleDetails && <div className="text-[9px] text-slate-800">{item.sampleDetails}</div>}
                  {item.notes && <div className="text-[9px] text-slate-800">{item.notes}</div>}
                  {item.discountPercent > 0 && (
                    <div className="text-[8.5px] text-slate-600">Less Discount @ {item.discountPercent}%</div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom within Description Column: Notes on left, Tax lines on right */}
            <div className="pt-4 flex justify-between items-end">
              <div className="text-[9px] text-slate-800 italic">
                {items[0]?.visitType ? `(${items[0].visitType})` : ''}
              </div>
              <div className="text-right text-[9.5px] font-medium space-y-0.5 pr-1">
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
          <div className="border-r-[1.5px] border-black p-1 text-center font-mono">
            {items.map((item, idx) => (
              <div key={idx} className="py-0.5">{item.hsnSac || '998346'}</div>
            ))}
          </div>

          {/* Quantity Col */}
          <div className="border-r-[1.5px] border-black p-1 text-center font-medium">
            {items.map((item, idx) => (
              <div key={idx} className="py-0.5">{item.quantity}</div>
            ))}
          </div>

          {/* Rate Col */}
          <div className="border-r-[1.5px] border-black p-1 text-center font-mono">
            {items.map((item, idx) => (
              <div key={idx} className="py-0.5">{Number(item.rate).toFixed(0)}</div>
            ))}
          </div>

          {/* Per Col */}
          <div className="border-r-[1.5px] border-black p-1 text-center font-medium">
            {items.map((item, idx) => (
              <div key={idx} className="py-0.5">{item.per || 'No.'}</div>
            ))}
          </div>

          {/* Amount Col */}
          <div className="p-1.5 text-right font-mono flex flex-col justify-between">
            <div className="space-y-0.5">
              {items.map((item, idx) => (
                <div key={idx} className="font-semibold">
                  {Number(item.taxableAmount || item.quantity * item.rate).toFixed(2)}
                </div>
              ))}
            </div>

            {/* Tax values aligned with CGST / SGST */}
            <div className="space-y-0.5 font-medium">
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
        <div className="grid grid-cols-[1fr_90px] border-t-[1.5px] border-b-[1.5px] border-black font-bold text-[10px]">
          <div className="py-1 px-3 text-right">Total</div>
          <div className="py-1 px-1.5 text-right font-mono font-bold text-[11px]">
            {Number(invoice.grandTotal || 0).toFixed(2)}
          </div>
        </div>

        {/* 6. Amount Chargeable In Words & Tax In Words */}
        <div className="border-b-[1.5px] border-black p-2 text-[9.5px]">
          <div className="flex justify-between items-center text-slate-700">
            <span>Amount Chargeable (in words)</span>
            <span className="font-bold text-black text-[10px]">E. & O.E</span>
          </div>
          <div className="font-bold text-[10.5px] text-black mt-0.5">
            {invoice.amountInWords || convertNumberToWords(invoice.grandTotal)}
          </div>
          <div className="text-[9.5px] text-black mt-1">
            Tax Amount (in Words) <strong className="font-bold">{convertTaxToWords(totalTaxAmount)}</strong>
          </div>
        </div>

        {/* 7. Bottom Section: PAN, Bank Details, Declaration & Signatory */}
        <div className="grid grid-cols-12 divide-x-[1.5px] divide-black">
          {/* Left Sub-Section (6 cols): PAN + Declaration */}
          <div className="col-span-6 p-2 flex flex-col justify-between">
            <div>
              <div className="font-bold text-[10px] text-black mb-3">
                Company&apos;s PAN : <span className="font-bold">{company.pan || 'CRZPV0007J'}</span>
              </div>

              <div className="text-[9.5px] font-bold text-black mb-1">
                Declaration:
              </div>
              <div className="text-[8px] text-black leading-snug space-y-1">
                <p>1] Cheque, DD / RTGS in favour of <strong>GK Metal Testing Lab</strong> Payable at Trichy.</p>
                <p>2] GST category: (998346) technical testing and analysis service.</p>
                <p>3] We hereby declare that, there is no transfer of property in goods involved in execution of this contract which is leviable to tax as sale of goods. &ldquo;This is purely a service contract.&rdquo;</p>
                <p>4] All disputes Subject to Chennai Jurisdiction.</p>
              </div>
            </div>
          </div>

          {/* Right Sub-Section (6 cols): Bank Details + Signatory */}
          <div className="col-span-6 p-2 flex flex-col justify-between">
            {/* Bank Details */}
            <div className="text-[9.5px] mb-2">
              <div className="font-bold text-[10px] text-black mb-1">Company&apos;s Bank Details :</div>
              <div className="grid grid-cols-[100px_1fr] text-[9px] leading-snug text-black">
                <span className="text-slate-700">Name of the Bank</span>
                <span className="font-bold">: {company.bankDetails?.bankName || 'Karur Vysya Bank'}</span>
                <span className="text-slate-700">Account No.</span>
                <span className="font-bold font-mono">: {company.bankDetails?.accountNumber || '1195135000016609'}</span>
                <span className="text-slate-700">Branch</span>
                <span className="font-bold">: {company.bankDetails?.branch || 'TRICHY MAIN BRANCH'}</span>
                <span className="text-slate-700">IFSC Code</span>
                <span className="font-bold font-mono">: {company.bankDetails?.ifscCode || 'KVBL0001195'}</span>
              </div>
            </div>

            {/* Authorised Signatory Box */}
            <div className="border-[1.5px] border-black p-2 flex flex-col justify-between h-28 text-right bg-white">
              <div className="font-bold text-[10px] text-black">
                For {company.companyName || 'GK Metal Testing Lab'}
              </div>
              <div className="flex justify-center items-center my-0.5">
                <img
                  src={company.signatureUrl || signatureImg}
                  alt="Authorised Signatory"
                  className="h-12 w-auto max-w-[130px] object-contain"
                />
              </div>
              <div className="font-bold text-[9.5px] text-black">
                Authorised Signatory
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 8. Footer Bar */}
      <div className="text-center py-1 text-[9px] text-slate-700 font-medium mt-0.5">
        This is a Computer Generated Invoice
      </div>
    </div>
  );
}
