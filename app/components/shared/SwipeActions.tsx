'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';
import { Edit3, Trash2 } from 'lucide-react';

interface SwipeAction {
  label: string;
  icon: React.ReactNode;
  color: 'edit' | 'delete';
  onClick: () => void;
}

interface SwipeActionsProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  threshold?: number;
}

export function SwipeActions({ children, actions, threshold = 80 }: SwipeActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const constraintsRef = useRef(null);

  const x = useMotionValue(0);
  const actionWidth = threshold;

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -threshold || velocity < -500) {
      setIsOpen(true);
    } else if (offset > threshold || velocity > 500) {
      setIsOpen(false);
    }
  };

  const handleAction = (action: SwipeAction) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div ref={constraintsRef} className="relative overflow-hidden rounded-xl">
      {/* Action Buttons */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-1">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleAction(action)}
            className={`flex items-center justify-center w-12 h-full rounded-lg transition-all active:scale-95 ${
              action.color === 'edit'
                ? 'bg-blue-500/80 hover:bg-blue-500 text-white'
                : 'bg-rose-500/80 hover:bg-rose-500 text-white'
            }`}
          >
            {action.icon}
          </button>
        ))}
      </div>

      {/* Swipeable Content */}
      <motion.div
        drag={isOpen ? false : 'x'}
        dragConstraints={{ left: -actionWidth * actions.length, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10 bg-[#141414] cursor-grab active:cursor-grabbing"
        onTap={() => isOpen && setIsOpen(false)}
      >
        {children}
      </motion.div>

      {/* Tap outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Simpler swipeable row for transaction lists
interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SwipeableRow({ children, onEdit, onDelete }: SwipeableRowProps) {
  return (
    <SwipeActions
      actions={[
        ...(onEdit ? [{
          label: 'Edit',
          icon: <Edit3 className="w-4 h-4" />,
          color: 'edit' as const,
          onClick: onEdit
        }] : []),
        ...(onDelete ? [{
          label: 'Hapus',
          icon: <Trash2 className="w-4 h-4" />,
          color: 'delete' as const,
          onClick: onDelete
        }] : [])
      ]}
    >
      {children}
    </SwipeActions>
  );
}
