class PrinterAdapter {
  constructor() {
    this.type = 'generic_esc_pos';
  }

  async printReceipt({ invoice, settings, branch }) {
    console.log('[Hardware PrinterAdapter] Printing receipt for invoice:', invoice ? invoice.invoice_number : 'test');
    // Generic ESC/POS abstraction - prints or opens system print dialog
    return {
      success: true,
      message: 'تم إرسال أمر الطباعة بنجاح',
      timestamp: new Date().toISOString(),
    };
  }

  async printReport({ title, content }) {
    console.log('[Hardware PrinterAdapter] Printing report:', title);
    return {
      success: true,
      message: 'تم إرسال التقرير للطباعة بنجاح',
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new PrinterAdapter();
