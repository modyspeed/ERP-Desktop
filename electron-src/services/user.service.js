const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const permissionRepository = require('../repositories/permission.repository');
const auditRepository = require('../repositories/audit.repository');

class UserService {
  searchUsers(params) {
    return userRepository.searchUsers(params);
  }

  getUser(id) {
    return userRepository.getUserWithPermissions(id);
  }

  createUser({ fullName, username, password, email, phone, roleId, branchId = 1, isActive = 1, currentUserId }) {
    if (!fullName || !username || !password || !roleId) {
      throw new Error('يرجى ملء جميع الحقول الإلزامية');
    }

    const existing = userRepository.findByUsername(username.trim());
    if (existing) {
      throw new Error('اسم المستخدم موجود بالفعل، يرجى اختيار اسم مستخدم آخر');
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = userRepository.create({
      full_name: fullName.trim(),
      username: username.trim(),
      password_hash: passwordHash,
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      role_id: Number(roleId),
      branch_id: Number(branchId),
      is_active: isActive ? 1 : 0,
      created_by: currentUserId || null,
    });

    auditRepository.log({
      userId: currentUserId,
      module: 'users',
      action: 'create',
      recordId: newUser.id,
      oldValue: null,
      newValue: { id: newUser.id, username: newUser.username, fullName: newUser.full_name },
    });

    return userRepository.getUserWithPermissions(newUser.id);
  }

  updateUser(id, { fullName, email, phone, roleId, branchId, isActive, password, currentUserId }) {
    const existing = userRepository.findById(id);
    if (!existing) {
      throw new Error('المستخدم غير موجود');
    }

    const updateData = {};
    if (fullName) updateData.full_name = fullName.trim();
    if (email !== undefined) updateData.email = email ? email.trim() : null;
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (roleId) updateData.role_id = Number(roleId);
    if (branchId) updateData.branch_id = Number(branchId);
    if (isActive !== undefined) updateData.is_active = isActive ? 1 : 0;
    if (password && password.trim().length >= 6) {
      updateData.password_hash = bcrypt.hashSync(password.trim(), 10);
    }

    const updated = userRepository.update(id, updateData);

    auditRepository.log({
      userId: currentUserId,
      module: 'users',
      action: 'update',
      recordId: id,
      oldValue: { fullName: existing.full_name, email: existing.email, roleId: existing.role_id, isActive: existing.is_active },
      newValue: updateData,
    });

    return userRepository.getUserWithPermissions(id);
  }

  deleteUser(id, currentUserId) {
    const user = userRepository.findById(id);
    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    if (user.username === 'admin') {
      throw new Error('لا يمكن حذف حساب المدير العام الأساسي');
    }

    userRepository.softDelete(id);

    auditRepository.log({
      userId: currentUserId,
      module: 'users',
      action: 'delete',
      recordId: id,
      oldValue: { id: user.id, username: user.username },
      newValue: { is_deleted: 1 },
    });

    return true;
  }

  // Roles & Permissions management
  getAllRoles() {
    return roleRepository.findAllWithPermissions();
  }

  getAllPermissionsGrouped() {
    return permissionRepository.getGroupedByModule();
  }

  saveRole({ id, name, description, permissionIds, currentUserId }) {
    if (!name || !name.trim()) {
      throw new Error('اسم الدور مطلوب');
    }

    let roleId = id;
    let oldRole = null;

    if (id) {
      oldRole = roleRepository.findById(id);
      roleRepository.update(id, {
        name: name.trim(),
        description: description ? description.trim() : null,
      });
    } else {
      const newRole = roleRepository.create({
        name: name.trim(),
        description: description ? description.trim() : null,
        is_system: 0,
      });
      roleId = newRole.id;
    }

    if (permissionIds) {
      roleRepository.saveRolePermissions(roleId, permissionIds);
    }

    auditRepository.log({
      userId: currentUserId,
      module: 'roles',
      action: id ? 'update' : 'create',
      recordId: roleId,
      oldValue: oldRole,
      newValue: { name, description, permissionCount: permissionIds ? permissionIds.length : 0 },
    });

    return roleRepository.findAllWithPermissions();
  }

  deleteRole(id, currentUserId) {
    const role = roleRepository.findById(id);
    if (!role) throw new Error('الدور غير موجود');
    if (role.is_system) throw new Error('لا يمكن حذف الأدوار الافتراضية للنظام');

    const usersCount = userRepository.count({ role_id: id });
    if (usersCount > 0) {
      throw new Error(`لا يمكن حذف الدور لأنه مرتبط بـ ${usersCount} مستخدم`);
    }

    roleRepository.softDelete(id);

    auditRepository.log({
      userId: currentUserId,
      module: 'roles',
      action: 'delete',
      recordId: id,
      oldValue: role,
      newValue: { is_deleted: 1 },
    });

    return true;
  }
}

module.exports = new UserService();
