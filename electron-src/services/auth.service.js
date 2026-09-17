const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const auditRepository = require('../repositories/audit.repository');

class AuthService {
  async login({ username, password, ip = '127.0.0.1' }) {
    if (!username || !password) {
      throw new Error('يرجى إدخال اسم المستخدم وكلمة المرور');
    }

    const user = userRepository.findByUsername(username.trim());
    if (!user) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    if (!user.is_active) {
      throw new Error('تم تعطيل هذا الحساب، يرجى مراجعة المسؤول');
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // Get user with fresh permissions
    const userWithPerms = userRepository.getUserWithPermissions(user.id);

    // Log login action
    auditRepository.log({
      userId: user.id,
      module: 'auth',
      action: 'login',
      recordId: user.id,
      oldValue: null,
      newValue: { username: user.username, time: new Date().toISOString() },
      ip,
    });

    return {
      id: userWithPerms.id,
      username: userWithPerms.username,
      fullName: userWithPerms.full_name,
      email: userWithPerms.email,
      phone: userWithPerms.phone,
      avatar: userWithPerms.avatar,
      roleId: userWithPerms.role_id,
      roleName: userWithPerms.role_name,
      branchId: userWithPerms.branch_id,
      branchName: userWithPerms.branch_name,
      permissions: userWithPerms.permissions || [],
    };
  }

  async changePassword({ userId, currentPassword, newPassword }) {
    const user = userRepository.findById(userId);
    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      throw new Error('كلمة المرور الحالية غير صحيحة');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    userRepository.update(userId, { password_hash: newHash });

    auditRepository.log({
      userId,
      module: 'auth',
      action: 'change_password',
      recordId: userId,
      oldValue: null,
      newValue: { updated: true },
    });

    return true;
  }

  getCurrentUser(userId) {
    if (!userId) return null;
    return userRepository.getUserWithPermissions(userId);
  }
}

module.exports = new AuthService();
