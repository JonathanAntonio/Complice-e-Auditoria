import { NAV_GROUPS, NAV_ITEMS } from "../../config/nav-map";

const canAccess = (item, hasAnyPermission) =>
  item.requiredAny.length === 0 || hasAnyPermission(item.requiredAny);

const isPathMatch = (pathname, item) => {
  if (item.path === "/") {
    return pathname === "/";
  }

  if (pathname === item.path || pathname.startsWith(`${item.path}/`)) {
    return true;
  }

  return (item.aliases ?? []).some(
    (alias) => pathname === alias || pathname.startsWith(`${alias}/`),
  );
};

export const filterNavGroupsByPermission = (hasAnyPermission) =>
  NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccess(item, hasAnyPermission)),
  })).filter((group) => group.items.length > 0);

export const resolveNavContext = (pathname) => {
  const currentItem = NAV_ITEMS
    .filter((item) => isPathMatch(pathname, item))
    .sort((a, b) => b.path.length - a.path.length)[0];

  if (!currentItem) {
    return {
      sectionTitle: "Dashboard",
      sectionSubtitle: "Visão consolidada de compliance, auditoria e risco.",
      sectionGroup: "Operação",
      selectedKey: "/",
    };
  }

  return {
    sectionTitle: currentItem.label,
    sectionSubtitle: currentItem.description,
    sectionGroup: currentItem.groupLabel,
    selectedKey: currentItem.path,
  };
};
