const { dialog } = require('electron');
const importService = require('../services/import.service');

function registerImportIPC(ipcMain) {
  // اختيار الملف وقراءته وإرجاع المعاينة مع تمييز الأخطاء (بدون حفظ)
  ipcMain.handle('import:select-file', async (event, params) => {
    const { type, branch_id } = params || {};
    if (!importService.isValidType(type)) return { success: false, error: 'نوع الاستيراد غير مدعوم' };

    try {
      const dialogResult = await dialog.showOpenDialog({
        title: 'اختر ملف الاستيراد',
        properties: ['openFile'],
        filters: [{ name: 'Excel أو CSV', extensions: ['xlsx', 'xls', 'csv'] }],
      });

      if (dialogResult.canceled || !dialogResult.filePaths.length) {
        return { success: false, canceled: true };
      }

      const parsed = importService.parseFile(dialogResult.filePaths[0], type);
      if (!parsed.rows.length) {
        return { success: false, error: 'الملف لا يحتوي على صفوف بيانات قابلة للاستيراد' };
      }

      const rows = importService.preview(type, parsed.rows, branch_id || 1);
      return { success: true, data: { fileName: parsed.fileName, fields: parsed.fields, rows } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // حفظ الصفوف المختارة فقط داخل transaction واحد
  ipcMain.handle('import:apply', async (event, data) => {
    const { type, rows, branch_id, _userId, currentUserId } = data || {};
    if (!importService.isValidType(type)) return { success: false, error: 'نوع الاستيراد غير مدعوم' };
    if (!Array.isArray(rows) || !rows.length) return { success: false, error: 'لا توجد بيانات للاستيراد' };

    try {
      const result = importService.apply({
        type,
        rows,
        branch_id: branch_id || 1,
        created_by: _userId || currentUserId || null,
      });
      return {
        success: true,
        data: result,
        message: `تم استيراد ${result.imported} عنصر بنجاح${result.skipped ? ` (${result.skipped} صف مستبعد)` : ''}`,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = registerImportIPC;
