// Visibilidad de los set lists: mientras no está marcado como listo, solo lo ven
// su creador, sus colaboradores y los admins. Los set lists anteriores a esta
// regla no tienen `isReady` y se consideran listos.

export function visibleSetlistsFilter(userId: string | undefined, isAdmin: boolean) {
  if (isAdmin) return {};
  return {
    $or: [
      { isReady: { $ne: false } },
      { createdBy: userId },
      { collaborators: userId },
    ],
  };
}

type SetlistOwnership = {
  isReady?: boolean;
  createdBy?: { toString(): string; _id?: { toString(): string } } | null;
  collaborators?: { toString(): string; _id?: { toString(): string } }[];
};

const idOf = (ref: { toString(): string; _id?: { toString(): string } }) => (ref._id ?? ref).toString();

export function canSeeSetlist(setlist: SetlistOwnership, userId: string | undefined, isAdmin: boolean) {
  if (isAdmin || setlist.isReady !== false) return true;
  if (!userId) return false;
  if (setlist.createdBy && idOf(setlist.createdBy) === userId) return true;
  return setlist.collaborators?.some(c => idOf(c) === userId) ?? false;
}
