import amqp from 'amqplib/callback_api'

export function connectToRabbit(url: string): Promise<amqp.Channel> {
    console.log("Connecting to Rabbit ......")
    return new Promise((res, rej) => {
        amqp.connect(url, function (err, conn) {
            if (err) {
                console.error(err)
                console.error('Need to set QUEUE_URL in env')
                process.exit(1)
            }
            conn.createChannel(function (err, channel) {

                if (err) {
                    console.error(err)
                    process.exit(1)
                }
                res(channel)
            })
        })
    })
}
