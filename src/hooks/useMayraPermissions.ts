import { useState, useCallback, useMemo } from 'react';
import { PermissionItem } from '../types';
import { INITIAL_PERMISSIONS } from '../data/defaultData';

export function useMayraPermissions() {
  const [permissions, setPermissions] = useState<PermissionItem[]>(INITIAL_PERMISSIONS);

  const togglePermission = useCallback((id: string) => {
    setPermissions((prev) =>
      prev.map((perm) => {
        if (perm.id === id) {
          const nextStatus = perm.status === 'granted' ? 'denied' : 'granted';
          return { ...perm, status: nextStatus };
        }
        return perm;
      })
    );
  }, []);

  const grantPermission = useCallback((id: string) => {
    setPermissions((prev) =>
      prev.map((perm) => (perm.id === id ? { ...perm, status: 'granted' } : perm))
    );
  }, []);

  const revokePermission = useCallback((id: string) => {
    setPermissions((prev) =>
      prev.map((perm) => (perm.id === id ? { ...perm, status: 'denied' } : perm))
    );
  }, []);

  const grantedCount = useMemo(() => {
    return permissions.filter((p) => p.status === 'granted' || p.id === 'default_assistant').length;
  }, [permissions]);

  const totalCount = useMemo(() => {
    return permissions.length;
  }, [permissions]);

  const getPermission = useCallback((id: string) => {
    return permissions.find((p) => p.id === id);
  }, [permissions]);

  return {
    permissions,
    setPermissions,
    togglePermission,
    grantPermission,
    revokePermission,
    grantedCount,
    totalCount,
    getPermission
  };
}
