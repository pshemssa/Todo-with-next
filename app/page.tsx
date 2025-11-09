// 'use client'
// import { useState, useEffect } from 'react';
// import { Sun, Moon } from 'lucide-react';
// import { StickyNote } from './types';
// import { StickyNoteCard as StickyNoteComponent } from './components/StickyNoteCard';
// import { AddNoteButton } from './components/AddNoteButton';

// const COLORS = ['yellow', 'pink', 'green', 'blue', 'purple'];

// function App() {
//   const [notes, setNotes] = useState<StickyNote[]>(() => {
//     const saved = localStorage.getItem('sticky-notes');
//     return saved ? JSON.parse(saved) : [];
//   });

//   const [isDarkMode, setIsDarkMode] = useState(() => {
//     const saved = localStorage.getItem('darkMode');
//     return saved
//       ? JSON.parse(saved)
//       : window.matchMedia('(prefers-color-scheme: dark)').matches;
//   });

//   useEffect(() => {
//     localStorage.setItem('sticky-notes', JSON.stringify(notes));
//     localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
//   }, [notes, isDarkMode]);

//   const addNote = () => {
//     const newNote: StickyNote = {
//       id: crypto.randomUUID(),
//       text: '',
//       dueDate: undefined,
//       completed: false,
//       x: window.innerWidth / 2 - 128,
//       y: window.innerHeight / 2 - 100,
//       z: Math.max(...notes.map(n => n.z), 0) + 1,
//       color: COLORS[Math.floor(Math.random() * COLORS.length)],
//     };
//     setNotes(prev => [...prev, newNote]);
//   };

//   const updateNote = (id: string, updates: Partial<StickyNote>) => {
//     setNotes(prev =>
//       prev.map(note => (note.id === id ? { ...note, ...updates } : note))
//     );
//   };

//   const deleteNote = (id: string) => {
//     setNotes(prev => prev.filter(n => n.id !== id));
//   };

//   const bringToTop = (id: string) => {
//     const maxZ = Math.max(...notes.map(n => n.z), 0);
//     setNotes(prev =>
//       prev.map(note => (note.id === id ? { ...note, z: maxZ + 1 } : note))
//     );
//   };

//   return (
//     <div
//       className={`min-h-screen transition-colors duration-300 relative overflow-hidden ${
//         isDarkMode
//           ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
//           : 'bg-gradient-to-br from-sky-50 via-white to-indigo-50'
//       }`}
//     >
//       {/* Title */}
//       <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center py-6 pointer-events-none">
//         <h1
//           className={`text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg ${
//             isDarkMode ? 'text-white' : 'text-gray-800'
//           }`}
//         >
//           To-Do List
//         </h1>
//       </header>

//       {/* Dark-mode toggle */}
//       <button
//         onClick={() => setIsDarkMode(!isDarkMode)}
//         className={`fixed top-6 right-6 p-3 rounded-full shadow-lg transition-all z-50 pointer-events-auto ${
//           isDarkMode
//             ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
//             : 'bg-white text-gray-700 hover:bg-gray-100'
//         }`}
//       >
//         {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
//       </button>

//       {/* Notes */}
//       {notes.map(note => (
//         <StickyNoteComponent
//           key={note.id}
//           note={note}
//           onUpdate={updateNote}
//           onDelete={deleteNote}
//           onBringToTop={bringToTop}
//           isDarkMode={isDarkMode}
//           allNotes={notes}               // <-- pass the whole array
//         />
//       ))}

//       {/* Add button */}
//       <AddNoteButton onAdd={addNote} isDarkMode={isDarkMode} />
//     </div>
//   );
// }

// export default App;
'use client'
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { StickyNote } from './types';
import { StickyNoteCard } from './components/StickyNoteCard';
import { AddNoteButton } from './components/AddNoteButton';
import { subscribeToNotes, addNoteToFirestore, updateNoteInFirestore, deleteNoteFromFirestore } from './lib/firestoreService';
import AuthGuard from './components/AuthGuard';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const COLORS = ['yellow', 'pink', 'green', 'blue', 'purple'];

export default function Dashboard() {
  const [user, authLoading] = useAuthState(auth);
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  // Debug: Log everything
  useEffect(() => {
    console.log('=== AUTH STATE ===', { user, authLoading });
  }, [user, authLoading]);

  useEffect(() => {
    console.log('=== NOTES STATE ===', notes);
  }, [notes]);

  useEffect(() => {
    if (!user) {
      console.log('No user found, skipping subscription');
      setNotes([]);
      setDataLoading(false);
      return;
    }

    console.log('Setting up Firestore subscription for user:', user.email);
    setDataLoading(true);

    const unsubscribe = subscribeToNotes((firebaseNotes) => {
      console.log('🔥 FIRESTORE NOTES RECEIVED:', firebaseNotes);
      console.log('Number of notes:', firebaseNotes.length);
      setNotes(firebaseNotes);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const addNote = async () => {
    if (!user) {
      alert('Please log in to add notes');
      return;
    }

    console.log('=== ADDING NEW NOTE ===');

    const newNote: Omit<StickyNote, 'id'> = {
      text: 'Click to edit me!', // Default text
      dueDate: '',
      completed: false,
      x: 100 + (notes.length * 20), // Stagger positions
      y: 100 + (notes.length * 20),
      z: Math.max(0, ...notes.map(n => n.z)) + 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      userEmail: user.email!
    };

    try {
      console.log('Sending to Firestore:', newNote);
      const noteId = await addNoteToFirestore(newNote);
      console.log('Note added with ID:', noteId);
      
      // TEMPORARY: Add to local state immediately for testing
      const tempNote: StickyNote = {
        ...newNote,
        id: noteId
      };
      setNotes(prev => [...prev, tempNote]);
      
    } catch (error: any) {
      console.error('Error adding note:', error);
      alert(`Failed to add note: ${error.message}`);
    }
  };

  const updateNote = async (id: string, updates: Partial<StickyNote>) => {
    try {
      await updateNoteInFirestore(id, updates);
      // Update local state optimistically
      setNotes(prev => prev.map(note => 
        note.id === id ? { ...note, ...updates } : note
      ));
    } catch (error: any) {
      console.error('Error updating note:', error);
      alert('Failed to update note');
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await deleteNoteFromFirestore(id);
      // Update local state optimistically
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (error: any) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  
  const bringToTop = (id: string) => {
    const maxZ = Math.max(0, ...notes.map(n => n.z));
    updateNote(id, { z: maxZ + 1 });
  };

  const loading = authLoading || dataLoading;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading your tasks...</p>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div
        className={`min-h-screen transition-colors duration-300 relative overflow-hidden ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
            : 'bg-gradient-to-br from-sky-50 via-white to-indigo-50'
        }`}
      >
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between py-4 px-6 bg-emerald-200">
          <div></div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            To-Do List
          </h1>
          <div className="flex items-center gap-4">
            <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className={`px-3 py-1 rounded text-sm ${
                isDarkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
              }`}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dark mode toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`fixed top-4 left-4 p-2 rounded-full z-50 ${
            isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-white text-gray-700'
          }`}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* NOTES DISPLAY AREA */}
        <div className="pt-20"> {/* Space for header */}
          {notes.length > 0 ? (
            notes.map(note => (
              <StickyNoteCard
                key={note.id}
                note={note}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onBringToTop={bringToTop}
                isDarkMode={isDarkMode}
                allNotes={notes}
              />
            ))
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p className="text-xl mb-2">No tasks yet</p>
                <p className="text-sm">Click the + button to add your first task</p>
              </div>
            </div>
          )}
        </div>

        {/* Add button */}
        <AddNoteButton onAdd={addNote} isDarkMode={isDarkMode} />

        {/* Debug info - always visible */}
        <div className={`fixed bottom-4 left-4 text-xs p-2 rounded ${
          isDarkMode ? 'bg-gray-800 text-green-400' : 'bg-green-100 text-green-800'
        }`}>
          <div>Notes on screen: {notes.length}</div>
          <div>User: {user?.email || 'Not logged in'}</div>
          <div>Loading: {loading ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </AuthGuard>
  );
}