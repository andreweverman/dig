import Catalog from '../services/CatalogService'
import Dug from '../services/DugService'
import Dig from '../services/DigService'
import { connectToRabbit } from './Connect'
import { Queues } from './enums'

const classLookup = new Map()
classLookup.set(Queues.dig, Dig.getInstance())
classLookup.set(Queues.dug, Dug.getInstance())
classLookup.set(Queues.catalog, Catalog.getInstance())



export async function consumeServiceQueueMessages() {
    let channel = await connectToRabbit(process.env.QUEUE_URL!)

    for (const queueName in Queues) {
        const q = await channel.assertQueue(queueName);

        const instance = classLookup.get(queueName)
        channel.consume(q.queue, (msg) => {
            const data = JSON.parse(msg.content);
            instance.service(data)
            channel.ack(msg);
        });

    }
}

