class CashDrawerAdapter {
  async openDrawer() {
    console.log('[Hardware CashDrawerAdapter] Triggering cash drawer kick pulse via printer');
    return {
      success: true,
      message: 'تم إرسال إشارة فتح الدرج',
    };
  }
}

module.exports = new CashDrawerAdapter();
