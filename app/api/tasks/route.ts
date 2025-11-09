import { NextResponse } from "next/server";
import {db} from '../../lib/firebase'
import { collection, addDoc, getDocs} from "firebase/firestore";
import { describe } from "node:test";

export async function GET(){
    const snapshot = await getDocs(collection(db, 'task-manager'));
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(tasks);
}

export async function POST(req: Request){
    try {
        const body = await req.json();
        const newTaskRef = await addDoc(collection(db, 'task-manager'), {
           text: body.text,
           updatedAt: new Date()
        }
        )
        return NextResponse.json({
            id: newTaskRef.id,
           text: body.text,
            updatedAt: new Date()
        })
    }
    catch (error) {
        console.error('POST /api/tasks error: ', error);
        return NextResponse.json({error: 'Failed to create task'}, {status: 500});
    }
}
    