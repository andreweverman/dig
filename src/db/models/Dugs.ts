import mongoose, { Schema, Document, ObjectId } from 'mongoose'

export interface IDug {
    userID: ObjectId
    playlistID: string
    lastRun: Date
    running: boolean
}

export interface IDugDoc extends IDug, Document {}

const DugSchema = new Schema({
    userID: { type: mongoose.Types.ObjectId, required: true },
    playlistID: { type: String, required: true },
    lastRun: { type: Date, required: true, default: new Date('1998-07-12T16:00:00Z') },
    running: { type: Boolean, default: false },
})

DugSchema.pre<IDugDoc>('save', function(next) {   
    if(this.isModified("playlistID")){
        this.lastRun =  new Date('1998-07-12T16:00:00Z') 
    }
    next();
});

export default mongoose.model<IDugDoc>('Dugs', DugSchema)
