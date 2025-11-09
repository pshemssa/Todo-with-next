import { NextResponse } from 'next/server'
import {db} from '../../../lib/firebase'
import {doc, updateDoc, deleteDoc} from 'firebase/firestore'

export async function PUT(req: Request, context: {params: any}){
    try{
        const {id} = await context.params;
        if (!id){
            return NextResponse.json({error: 'Task ID is required'}, {status: 400});
        }
        const body = await req.json();
        const taskRef = doc(db, 'task-manager', id);
        await updateDoc(taskRef, {
            ...body,
            updatedAt: new Date(),
        });
        return NextResponse.json({id, ...body});
    }
    catch (error) {
        console.error('PUT /api/tasks/[id] error: ', error);
        return NextResponse.json({error: 'Failed to update task'}, {status: 500});
    }
}

export async function DELETE(req: Request, context: {params: any}){
    try{
        const {id} = await context.params;
        if (!id){
            return NextResponse.json({error: 'Task ID is required'}, {status: 400});
        }
        const taskRef = doc(db, 'task-manager', id);
        await deleteDoc(taskRef);

        return NextResponse.json({message: 'Task deleted successfully'});
    }
    catch (error) {
        console.error('DELETE /api/tasks/[id] error: ', error);
        return NextResponse.json({error: 'Failed to delete task'}, {status: 500});
    }
}