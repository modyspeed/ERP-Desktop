const fs = require('fs');
const path = require('path');
const settingRepository = require('../repositories/setting.repository');
const branchRepository = require('../repositories/branch.repository');
const auditRepository = require('../repositories/audit.repository');
const { getDatabase } = require('../database/db');

class SettingService {
  getSettings() {
    return settingRepository.getSettings();
  }

  updateSettings(data, currentUserId) {
    const oldSettings = settingRepository.getSettings();
    const updated = settingRepository.updateSettings(data);

    auditRepository.log({
      userId: currentUserId,
      module: 'settings',
      action: 'update',
      recordId: 1,
      oldValue: oldSettings,
      newValue: updated,
    });

    return updated;
  }

  saveLogo({ fileBuffer, fileName, currentUserId }) {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'branding');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(fileName) || '.png';
    const newFileName = `logo_${Date.now()}${ext}`;
    const targetPath = path.join(uploadsDir, newFileName);

    fs.writeFileSync(targetPath, Buffer.from(fileBuffer));
    const relativePath = `/uploads/branding/${newFileName}`;

    const updated = settingRepository.updateSettings({ logo_path: relativePath });

    auditRepository.log({
      userId: currentUserId,
      module: 'settings',
      action: 'upload_logo',
      recordId: 1,
      oldValue: null,
      newValue: { logo_path: relativePath },
    });

    return updated;
  }

  // Branch management
  getAllBranches() {
    return branchRepository.findAll({}, { orderBy: 'is_main_branch DESC, id ASC' });
  }

  saveBranch({ id, name, address, phone, isMainBranch, isActive, currentUserId }) {
    if (!name || !name.trim()) throw new Error('اسم الفرع مطلوب');

    let branchId = id;
    let oldBranch = null;

    if (id) {
      oldBranch = branchRepository.findById(id);
      branchRepository.update(id, {
        name: name.trim(),
        address: address ? address.trim() : null,
        phone: phone ? phone.trim() : null,
        is_active: isActive ? 1 : 0,
      });
    } else {
      const created = branchRepository.create({
        name: name.trim(),
        address: address ? address.trim() : null,
        phone: phone ? phone.trim() : null,
        is_main_branch: 0,
        is_active: isActive !== undefined ? (isActive ? 1 : 0) : 1,
        created_by: currentUserId || null,
      });
      branchId = created.id;
    }

    if (isMainBranch) {
      branchRepository.setMainBranch(branchId);
    }

    auditRepository.log({
      userId: currentUserId,
      module: 'branches',
      action: id ? 'update' : 'create',
      recordId: branchId,
      oldValue: oldBranch,
      newValue: { name, address, phone, isMainBranch },
    });

    return branchRepository.findAll({}, { orderBy: 'is_main_branch DESC, id ASC' });
  }

  deleteBranch(id, currentUserId) {
    const branch = branchRepository.findById(id);
    if (!branch) throw new Error('الفرع غير موجود');
    if (branch.is_main_branch) throw new Error('لا يمكن حذف الفرع الرئيسي');

    branchRepository.softDelete(id);

    auditRepository.log({
      userId: currentUserId,
      module: 'branches',
      action: 'delete',
      recordId: id,
      oldValue: branch,
      newValue: { is_deleted: 1 },
    });

    return true;
  }

  getCountries() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM countries WHERE is_active = 1 ORDER BY name_ar').all();
  }

  getCurrencies() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM currencies WHERE is_active = 1 ORDER BY name_ar').all();
  }

  getFonts() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM fonts WHERE is_active = 1 ORDER BY name_ar').all();
  }
}

module.exports = new SettingService();
