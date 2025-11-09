import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { StickyNote } from '../types';

export const subscribeToNotes = (callback: (notes: StickyNote[]) => void) => {
  const user = auth.currentUser;
  if (!user || !user.email) {
    console.log('No authenticated user');
    callback([]);
    return () => {};
  }

  console.log('Setting up listener for user:', user.email);
  
  const q = query(
    collection(db, 'task-manager'),
    where('userEmail', '==', user.email)
  );

  const unsubscribe = onSnapshot(q, 
    (querySnapshot) => {
      const notes: StickyNote[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Raw Firestore data:', data);
        
        const note: StickyNote = {
          id: doc.id,
          text: data.text || 'Empty note',
          dueDate: data.dueDate || undefined,
          completed: data.completed || false,
          x: typeof data.x === 'number' ? data.x : 100,
          y: typeof data.y === 'number' ? data.y : 100,
          z: typeof data.z === 'number' ? data.z : 1,
          color: data.color || 'yellow',
          userEmail: data.userEmail || user.email!
        };
        
        notes.push(note);
      });

      console.log('Processed notes for display:', notes);
      callback(notes);
    },
    (error) => {
      console.error('Firestore listener error:', error);
      callback([]);
    }
  );

  return unsubscribe;
};

export const addNoteToFirestore = async (note: Omit<StickyNote, 'id'>): Promise<string> => {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('Not authenticated');

  const noteData = {
    text: note.text || 'New note',
    dueDate: note.dueDate || null, // Use null instead of empty string
    completed: note.completed || false,
    x: note.x || 100,
    y: note.y || 100,
    z: note.z || 1,
    color: note.color || 'yellow',
    userEmail: user.email,
    createdAt: Timestamp.now()
  };

  console.log('Adding note to Firestore:', noteData);
  const docRef = await addDoc(collection(db, 'task-manager'), noteData);
  return docRef.id;
};

export const updateNoteInFirestore = async (id: string, updates: Partial<StickyNote>) => {
  const cleanUpdates = { ...updates };
  // Remove undefined values
  Object.keys(cleanUpdates).forEach(key => {
    if (cleanUpdates[key as keyof StickyNote] === undefined) {
      delete cleanUpdates[key as keyof StickyNote];
    }
  });

  await updateDoc(doc(db, 'task-manager', id), {
    ...cleanUpdates,
    updatedAt: Timestamp.now()
  });
};

export const deleteNoteFromFirestore = async (id: string) => {
  await deleteDoc(doc(db, 'task-manager', id));
};