import React from 'react';
import InvoiceForm from '../components/invoice/InvoiceForm';

export default function InvoiceCreatePage() {
  return (
    <div>
      <InvoiceForm isEdit={false} />
    </div>
  );
}
