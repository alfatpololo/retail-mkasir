'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface Role {
  id: string;
  name: string;
  permissions: {
    inputProduct: boolean;
    viewReports: boolean;
    voidTransaction: boolean;
    openCloseCashier: boolean;
    printerSettings: boolean;
  };
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Admin',
      permissions: {
        inputProduct: true,
        viewReports: true,
        voidTransaction: true,
        openCloseCashier: true,
        printerSettings: true,
      },
    },
    {
      id: '2',
      name: 'Kasir',
      permissions: {
        inputProduct: false,
        viewReports: false,
        voidTransaction: false,
        openCloseCashier: true,
        printerSettings: false,
      },
    },
    {
      id: '3',
      name: 'Owner',
      permissions: {
        inputProduct: true,
        viewReports: true,
        voidTransaction: true,
        openCloseCashier: true,
        printerSettings: true,
      },
    },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const permissionLabels = {
    inputProduct: 'Input Product',
    viewReports: 'View Reports',
    voidTransaction: 'Void Transaction',
    openCloseCashier: 'Open/Close Cashier',
    printerSettings: 'Printer Settings',
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pl-0 2xl:pl-64">
      <Sidebar />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Roles & Permissions</h1>
            <p className="text-gray-600">Manage user roles and access permissions</p>
          </div>
          <button
            onClick={() => {
              setEditingRole(null);
              setShowModal(true);
            }}
            className="px-5 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <span className="ri-add-line w-5 h-5 flex items-center justify-center"></span>
            Add Role
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role Name</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Input Product</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">View Reports</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Void Transaction</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Open/Close Cashier</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Printer Settings</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{role.name}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {role.permissions.inputProduct ? (
                        <span className="ri-checkbox-circle-fill w-5 h-5 flex items-center justify-center text-green-500 mx-auto"></span>
                      ) : (
                        <span className="ri-close-circle-fill w-5 h-5 flex items-center justify-center text-gray-300 mx-auto"></span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {role.permissions.viewReports ? (
                        <span className="ri-checkbox-circle-fill w-5 h-5 flex items-center justify-center text-green-500 mx-auto"></span>
                      ) : (
                        <span className="ri-close-circle-fill w-5 h-5 flex items-center justify-center text-gray-300 mx-auto"></span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {role.permissions.voidTransaction ? (
                        <span className="ri-checkbox-circle-fill w-5 h-5 flex items-center justify-center text-green-500 mx-auto"></span>
                      ) : (
                        <span className="ri-close-circle-fill w-5 h-5 flex items-center justify-center text-gray-300 mx-auto"></span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {role.permissions.openCloseCashier ? (
                        <span className="ri-checkbox-circle-fill w-5 h-5 flex items-center justify-center text-green-500 mx-auto"></span>
                      ) : (
                        <span className="ri-close-circle-fill w-5 h-5 flex items-center justify-center text-gray-300 mx-auto"></span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {role.permissions.printerSettings ? (
                        <span className="ri-checkbox-circle-fill w-5 h-5 flex items-center justify-center text-green-500 mx-auto"></span>
                      ) : (
                        <span className="ri-close-circle-fill w-5 h-5 flex items-center justify-center text-gray-300 mx-auto"></span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEdit(role)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingRole ? 'Edit Role' : 'Add Role'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <span className="ri-close-line w-5 h-5 flex items-center justify-center text-gray-600"></span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                <input
                  type="text"
                  defaultValue={editingRole?.name || ''}
                  placeholder="Enter role name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                <div className="space-y-3">
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={editingRole?.permissions[key as keyof typeof editingRole.permissions]}
                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {editingRole ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
