'use client'
import { Trash2, GripVertical, Calendar, CheckSquare, Square } from 'lucide-react';
import { StickyNote } from '../types';
import { useState, useRef } from 'react';

interface StickyNoteCardProps {
  note: StickyNote;
  onUpdate: (id: string, updates: Partial<StickyNote>) => void;
  onDelete: (id: string) => void;
  onBringToTop: (id: string) => void;
  isDarkMode: boolean;
  allNotes: StickyNote[];               // <-- needed for collision check
}

const NOTE_W = 256;   // w-64 → 16 rem = 256 px
const NOTE_H = 180;   // approximate height (tweak if you change padding)

export function StickyNoteCard({
  note,
  onUpdate,
  onDelete,
  onBringToTop,
  isDarkMode,
  allNotes,
}: StickyNoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);
  const [editDue, setEditDue] = useState(note.dueDate || '');
  const cardRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  const colorClasses = {
    yellow: isDarkMode ? 'bg-yellow-700/90 border-yellow-600' : 'bg-yellow-200 border-yellow-400',
    pink:   isDarkMode ? 'bg-pink-700/90   border-pink-600'   : 'bg-pink-200   border-pink-400',
    green:  isDarkMode ? 'bg-green-700/90  border-green-600'  : 'bg-green-200  border-green-400',
    blue:   isDarkMode ? 'bg-blue-700/90   border-blue-600'   : 'bg-blue-200   border-blue-400',
    purple: isDarkMode ? 'bg-purple-700/90 border-purple-600' : 'bg-purple-200 border-purple-400',
  };

  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';

  
  const rectsIntersect = (
    a: DOMRect,
    b: DOMRect
  ) => !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);

  const findFreeSpot = (desiredX: number, desiredY: number, ownId: string) => {
    const others = allNotes
      .filter(n => n.id !== ownId)
      .map(n => new DOMRect(n.x, n.y, NOTE_W, NOTE_H));

    const test = (x: number, y: number) => {
      const r = new DOMRect(x, y, NOTE_W, NOTE_H);
      return !others.some(o => rectsIntersect(r, o));
    };

    if (test(desiredX, desiredY)) return { x: desiredX, y: desiredY };

    // spiral outward
    let dx = 0,
      dy = -20,
      steps = 1;
    while (true) {
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < steps; j++) {
          const tx = desiredX + dx;
          const ty = desiredY + dy;
          if (test(tx, ty)) return { x: tx, y: ty };
          if (i === 0) dx += 20;
          else dy += 20;
        }
        [dx, dy] = [-dy, dx];
      }
      steps++;
    }
  };

  
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // ignore clicks on buttons

    onBringToTop(note.id);
    const rect = cardRef.current!.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const move = (ev: MouseEvent) => {
      if (!dragOffset.current) return;
      const newX = ev.clientX - dragOffset.current.x;
      const newY = ev.clientY - dragOffset.current.y;
      onUpdate(note.id, { x: newX, y: newY });
    };

    const up = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);

      // final collision-free position
      const final = findFreeSpot(ev.clientX - dragOffset.current!.x,
                                 ev.clientY - dragOffset.current!.y,
                                 note.id);
      onUpdate(note.id, { x: final.x, y: final.y });
      dragOffset.current = null;
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  
  const saveEdit = () => {
    onUpdate(note.id, {
      text: editText.trim() || 'Untitled',
      dueDate: editDue || undefined,
    });
    setIsEditing(false);
  };

  
  return (
    <div
      ref={cardRef}
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: `${note.x}px`,
        top: `${note.y}px`,
        zIndex: note.z,
        cursor: 'move',
        userSelect: 'none',
      }}
      className={`w-64 p-4 rounded-lg border-2 shadow-lg ${colorClasses[note.color as keyof typeof colorClasses]}`}
    >
      {/* ----- header ----- */}
      <div className="flex items-center justify-between mb-2">
        <GripVertical size={18} className="text-gray-600" />
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="p-1 rounded hover:bg-white/20"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* ----- edit mode ----- */}
      {isEditing ? (
        <div onClick={e => e.stopPropagation()}>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            className={`w-full resize-none bg-transparent outline-none ${textColor} text-sm`}
            rows={3}
            autoFocus
          />
          <input
            type="date"
            value={editDue}
            onChange={e => setEditDue(e.target.value)}
            className={`mt-2 w-full text-xs px-1 py-0.5 rounded bg-white/20 ${textColor}`}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={saveEdit}
              className="flex-1 text-xs py-1 bg-white/30 rounded hover:bg-white/50"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 text-xs py-1 bg-white/20 rounded hover:bg-white/30"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ----- text ----- */}
          <div
            onDoubleClick={() => setIsEditing(true)}
            className={`font-medium text-sm break-words ${note.completed ? 'line-through opacity-70' : ''} ${textColor}`}
          >
            {note.text || 'Untitled'}
          </div>

          {/* ----- due date ----- */}
          {note.dueDate && (
            <div className={`text-xs flex items-center gap-1 mt-2 ${textColor} opacity-80`}>
              <Calendar size={12} />
              {new Date(note.dueDate).toLocaleDateString()}
            </div>
          )}

          {/* ----- actions ----- */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={e => {
                e.stopPropagation();
                onUpdate(note.id, { completed: !note.completed });
              }}
              className="p-1 rounded hover:bg-white/20"
            >
              {note.completed ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="text-xs opacity-60 hover:opacity-100"
            >
              Edit
            </button>
          </div>
        </>
      )}
    </div>
  );
}