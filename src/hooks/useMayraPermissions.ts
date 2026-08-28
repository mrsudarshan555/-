import { useState, useCallback, useMemo } from 'react';
import { PermissionItem } from '../types';
import { INITIAL_PERMISSIONS } from '../data/defaultData';

const PERMISSIONS_STORAGE_KEY = 'mayra_permissions_config';

function getInitialPermissions(): PermissionItem[] {
  if (typeof window === 'undefined') return INITIAL_PERMISSIONS;
  try {
    const saved = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with INITIAL_PERMISSIONS to ensure any new permissions exist
        const map = new Map<string, PermissionItem>(parsed.map((p: PermissionItem) => [p.id, p]));
        return INITIAL_PERMISSIONS.map((defaultPerm) => {
          const stored = map.get(defaultPerm.id);
          return stored ? { ...defaultPerm, ...stored } : defaultPerm;
        });
      }
    }
  } catch (e) {}
  return INITIAL_PERMISSIONS;
}

export function useMayraPermissions() {
  const [permissions, setPermissionsState] = useState<PermissionItem[]>(getInitialPermissions);

  const setPermissions = useCallback((update: React.SetStateAction<PermissionItem[]>) => {
    setPermissionsState((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      try {
        localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

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
  }, [setPermissions]);

  const grantPermission = useCallback((id: string) => {
    setPermissions((prev) =>
      prev.map((perm) => (perm.id === id ? { ...perm, status: 'granted' } : perm))
    );
  }, [setPermissions]);

  const revokePermission = useCallback((id: string) => {
    setPermissions((prev) =>
      prev.map((perm) => (perm.id === id ? { ...perm, status: 'denied' } : perm))
    );
  }, [setPermissions]);

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
