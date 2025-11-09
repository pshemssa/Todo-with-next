'use client'
import { Plus } from 'lucide-react';

interface AddNoteButtonProps {
  onAdd: () => void;
  isDarkMode: boolean;
}

export function AddNoteButton({ onAdd, isDarkMode }: AddNoteButtonProps) {
  return (
    <button
      onClick={onAdd}
      className={`fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
        isDarkMode
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
      }`}
    >
      <Plus size={28} />
    </button>
  );
}