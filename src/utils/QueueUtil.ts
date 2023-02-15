import amqp from 'amqplib/callback_api'
import moment from 'moment'
import { v4 as uuidv4 } from 'uuid'

import { Queues, ServiceMessage } from '../utils/enums'
import {connectToRabbit} from './Connect'

let ch: amqp.Channel
export const publishToQueue = async (queueName: Queues, serviceId: string) => {
    let message: ServiceMessage = {
        id: uuidv4(),
        serviceId,
        timestamp: moment.utc().toDate()
    }
    if (!ch) {
        ch = await connectToRabbit(process.env.QUEUE_URL!)
    }
    ch.assertQueue(queueName, {
        durable: true,
    })
    return ch.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
        contentType: 'application/json',
        contentEncoding: 'utf-8',
    })
}
process.on('exit', (_) => {
    ch.close(() => {
        console.error('Error closing')
    })
    console.log(`Closing rabbitmq channel`)
})

