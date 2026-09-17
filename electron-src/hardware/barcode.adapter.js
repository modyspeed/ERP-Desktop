class BarcodeAdapter {
  constructor() {
    this.mode = 'keyboard_wedge'; // Standard USB keyboard emulation mode
  }

  parseScannedBarcode(rawInput) {
    if (!rawInput) return '';
    return rawInput.trim().replace(/[\r\n]/g, '');
  }
}

module.exports = new BarcodeAdapter();
