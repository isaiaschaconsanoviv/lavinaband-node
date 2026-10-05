'use client';

import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Dibuja un modal directamente en <body>. Un `position: fixed` dentro de un elemento con
// `backdrop-blur`, `transform` o `filter` se ancla a ese elemento y no a la ventana, y el
// modal puede quedar fuera de la vista (por ejemplo, en las tarjetas del Rol).
export default function ModalPortal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
